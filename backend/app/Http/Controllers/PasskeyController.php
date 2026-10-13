<?php

namespace App\Http\Controllers;

use App\Models\Passkey;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tymon\JWTAuth\Facades\JWTAuth;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;

class PasskeyController extends Controller
{
    private function getSerializer()
    {
        $manager = new AttestationStatementSupportManager([new NoneAttestationStatementSupport()]);
        return (new WebauthnSerializerFactory($manager))->create();
    }

    private function getFactory(): CeremonyStepManagerFactory
    {
        $factory = new CeremonyStepManagerFactory();
        $factory->setAllowedOrigins([
            env('APP_URL', 'http://localhost:8000'),
            env('FRONTEND_URL', 'http://localhost:5173'),
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
        ]);
        return $factory;
    }

    private function getRpId(): string
    {
        return parse_url(env('FRONTEND_URL', 'http://localhost:5173'), PHP_URL_HOST) ?? 'localhost';
    }

    // ─── REGISTRATION ────────────────────────────────────────────────

    public function registerOptions(Request $request)
    {
        $user = auth()->user();

        $rp = PublicKeyCredentialRpEntity::create(
            name: config('app.name', 'TurboStore'),
            id:   $this->getRpId(),
        );

        $userEntity = PublicKeyCredentialUserEntity::create(
            name:        $user->email,
            id:          (string) $user->id,
            displayName: $user->name,
        );

        $options = new PublicKeyCredentialCreationOptions(
            rp:             $rp,
            user:           $userEntity,
            challenge:      random_bytes(32),
            pubKeyCredParams: [
                PublicKeyCredentialParameters::createPk(-7),   // ES256
                PublicKeyCredentialParameters::createPk(-257), // RS256
            ],
            authenticatorSelection: new AuthenticatorSelectionCriteria(
                authenticatorAttachment: AuthenticatorSelectionCriteria::AUTHENTICATOR_ATTACHMENT_PLATFORM,
                userVerification:        AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_REQUIRED,
                residentKey:             AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED,
            ),
            attestation: 'none',
        );

        Cache::put("passkey_register_{$user->id}", $this->getSerializer()->serialize($options, 'json'), 300);

        return response($this->getSerializer()->serialize($options, 'json'))
            ->header('Content-Type', 'application/json');
    }

    public function registerVerify(Request $request)
    {
        $user = auth()->user();

        $cached = Cache::pull("passkey_register_{$user->id}");
        if (!$cached) {
            return response()->json(['message' => 'Registration session expired. Please try again.'], 400);
        }

        $serializer = $this->getSerializer();

        try {
            $options    = $serializer->deserialize($cached, PublicKeyCredentialCreationOptions::class, 'json');
            $credential = $serializer->deserialize(json_encode($request->all()), PublicKeyCredential::class, 'json');

            $validator = AuthenticatorAttestationResponseValidator::create(
                $this->getFactory()->creationCeremony()
            );

            $credentialRecord = $validator->check(
                $credential->response,
                $options,
                $this->getRpId(),
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Passkey verification failed: ' . $e->getMessage()], 422);
        }

        $name = $request->input('name', 'My Passkey');

        $passkey = Passkey::fromCredentialRecord($credentialRecord, $user->id, $name);
        $passkey->save();

        return response()->json([
            'message' => 'Passkey registered successfully.',
            'passkey' => [
                'id'         => $passkey->id,
                'name'       => $passkey->name,
                'aaguid'     => $passkey->aaguid,
                'transports' => $passkey->transports,
                'created_at' => $passkey->created_at,
            ],
        ], 201);
    }

    // ─── AUTHENTICATION ───────────────────────────────────────────────

    public function authenticateOptions(Request $request)
    {
        $options = PublicKeyCredentialRequestOptions::create(
            challenge:        random_bytes(32),
            rpId:             $this->getRpId(),
            userVerification: PublicKeyCredentialRequestOptions::USER_VERIFICATION_REQUIREMENT_REQUIRED,
        );

        $sessionKey = 'passkey_auth_' . session()->getId();
        Cache::put($sessionKey, $this->getSerializer()->serialize($options, 'json'), 300);

        return response($this->getSerializer()->serialize($options, 'json'))
            ->header('Content-Type', 'application/json');
    }

    public function authenticateVerify(Request $request)
    {
        $sessionKey = 'passkey_auth_' . session()->getId();
        $cached     = Cache::pull($sessionKey);

        if (!$cached) {
            return response()->json(['message' => 'Authentication session expired. Please try again.'], 400);
        }

        $serializer = $this->getSerializer();

        try {
            $options    = $serializer->deserialize($cached, PublicKeyCredentialRequestOptions::class, 'json');
            $credential = $serializer->deserialize(json_encode($request->all()), PublicKeyCredential::class, 'json');
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid credential data: ' . $e->getMessage()], 422);
        }

        $credentialId = base64_encode($credential->rawId);
        $passkey      = Passkey::where('credential_id', $credentialId)->first();

        if (!$passkey) {
            return response()->json(['message' => 'Passkey not found.'], 404);
        }

        try {
            $credentialRecord = $passkey->toCredentialRecord();

            $validator = AuthenticatorAssertionResponseValidator::create(
                $this->getFactory()->requestCeremony()
            );

            $updatedRecord = $validator->check(
                credentialRecord:                  $credentialRecord,
                authenticatorAssertionResponse:    $credential->response,
                publicKeyCredentialRequestOptions: $options,
                host:                              $this->getRpId(),
                userHandle:                        null,
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Passkey authentication failed: ' . $e->getMessage()], 401);
        }

        // Update sign count + last used
        $serializer = $this->getSerializer();
        $passkey->update([
            'sign_count'   => $updatedRecord->counter,
            'public_key'   => $serializer->serialize($updatedRecord, 'json'),
            'last_used_at' => now(),
        ]);

        $user  = $passkey->user;
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message'        => 'Authenticated successfully.',
            'user'           => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'referral_code'  => $user->referral_code,
                'email_verified' => $user->hasVerifiedEmail(),
                'created_at'     => $user->created_at,
            ],
            'token'          => $token,
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    // ─── LIST / DELETE ────────────────────────────────────────────────

    public function index()
    {
        $passkeys = auth()->user()->passkeys()->get()->map(fn($p) => [
            'id'          => $p->id,
            'name'        => $p->name,
            'aaguid'      => $p->aaguid,
            'transports'  => $p->transports,
            'last_used_at'=> $p->last_used_at,
            'created_at'  => $p->created_at,
        ]);

        return response()->json(['passkeys' => $passkeys]);
    }

    public function destroy(int $id)
    {
        $passkey = auth()->user()->passkeys()->findOrFail($id);
        $passkey->delete();
        return response()->json(['message' => 'Passkey removed.']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\CredentialRecord;
use Webauthn\Denormalizer\WebauthnSerializerFactory;

class Passkey extends Model
{
    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'sign_count',
        'aaguid',
        'transports',
        'name',
        'last_used_at',
    ];

    protected $casts = [
        'transports'   => 'array',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toCredentialRecord(): CredentialRecord
    {
        $manager = new AttestationStatementSupportManager([new NoneAttestationStatementSupport()]);
        $serializer = (new WebauthnSerializerFactory($manager))->create();
        return $serializer->deserialize($this->public_key, CredentialRecord::class, 'json');
    }

    public static function fromCredentialRecord(CredentialRecord $record, int $userId, string $name = 'My Passkey'): self
    {
        $manager = new AttestationStatementSupportManager([new NoneAttestationStatementSupport()]);
        $serializer = (new WebauthnSerializerFactory($manager))->create();

        return new self([
            'user_id'       => $userId,
            'credential_id' => base64_encode($record->publicKeyCredentialId),
            'public_key'    => $serializer->serialize($record, 'json'),
            'sign_count'    => $record->counter,
            'aaguid'        => $record->aaguid->toRfc4122(),
            'transports'    => $record->transports,
            'name'          => $name,
        ]);
    }
}

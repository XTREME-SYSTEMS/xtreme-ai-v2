import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Generate a cryptographically random API key for external access to the
// Xtreme AI platform. Three key types:
// - admin: full read/write access to all entities and functions
// - user: read-only access to public data
// - vision_cortex: full diagnostic, heal, harden, optimize autonomy (the brain)

const PERMISSION_MAP: Record<string, string[]> = {
  admin: ['all'],
  user: ['read_public'],
  vision_cortex: [
    'all',
    'xps_catalog', 'prompt_library', 'lead_engine', 'bid_engine',
    'diagnostics', 'heal', 'harden', 'optimize', 'manage',
    'visualizer_inbox', 'auto_builder', 'mass_website_factory', 'queue_system',
  ],
};

function generateRandomKey(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars[buffer[i] % chars.length];
  }
  return key;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { key_name, key_type, permissions, expires_at } = body;

    if (!key_name || !key_type) {
      return Response.json({ error: 'key_name and key_type are required' }, { status: 400 });
    }

    if (!['admin', 'user', 'vision_cortex'].includes(key_type)) {
      return Response.json({ error: 'key_type must be admin, user, or vision_cortex' }, { status: 400 });
    }

    // Generate the key with a type-specific prefix
    const prefix = `xa_${key_type}_`;
    const randomPart = generateRandomKey(40);
    const keyValue = prefix + randomPart;
    const keyPrefix = keyValue.substring(0, 19);

    // Determine permissions
    const finalPermissions = permissions && Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : PERMISSION_MAP[key_type] || ['read_public'];

    // Create the API key record
    const created = await base44.entities.ApiKey.create({
      key_name,
      key_type,
      key_value: keyValue,
      key_prefix: keyPrefix,
      permissions: finalPermissions,
      active: true,
      expires_at: expires_at || null,
      created_by_email: user.email,
    });

    return Response.json({
      status: 'success',
      key_id: created.id,
      key_value: keyValue,
      key_type,
      key_name,
      permissions: finalPermissions,
      message: 'Save this key securely — it will not be shown again.',
    });
  } catch (error) {
    console.error('generateApiKey error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
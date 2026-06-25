import { getServerSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { Settings, KeyRound, User, Lock, Shield, Info, MapPin, UserCog } from 'lucide-react';

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  const isMaster = session.role === 'master';

  let siteName: string | null = null;
  if (!isMaster && session.siteId) {
    const supabase = createServerClient();
    const { data: site } = await supabase.from('sites').select('project_name').eq('id', session.siteId).maybeSingle();
    siteName = site?.project_name || null;
  }

  const roleLabel = isMaster ? 'Master (CEO)' : 'Site Manager';
  const roleBadge = isMaster ? 'bg-amber-400/10 text-amber-400' : 'bg-teal-400/10 text-teal-400';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">System configuration and account information</p>
      </div>

      {/* Current Session */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Current Session</h2>
            <p className="text-xs text-slate-500">Your active login information</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold uppercase ${roleBadge}`}>{roleLabel}</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Username</p>
              <p className="text-sm font-medium text-white">{session.username}</p>
            </div>
            {!isMaster && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Assigned Site</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <p className="text-sm font-medium text-white">{siteName || 'Unassigned'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Credentials (Master only) */}
      {isMaster && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Master Credentials</h2>
              <p className="text-xs text-slate-500">Managed via environment variables</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                icon={User}
                label="Master Username"
                value="MASTER_USERNAME / DEFAULT_ADMIN_USERNAME"
                description="Set in your .env file"
              />
              <InfoCard
                icon={Lock}
                label="Master Password"
                value="MASTER_PASSWORD / DEFAULT_ADMIN_PASSWORD"
                description="Set in your .env file"
                masked
              />
            </div>

            <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-amber-400">Changing Master Credentials</p>
                  <p className="text-slate-400">
                    Master credentials are loaded from environment variables at startup. To change them:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 mt-2">
                    <li>Open your <code className="text-amber-300 bg-slate-800 px-1 rounded text-xs">.env</code> file in the project root</li>
                    <li>Update <code className="text-amber-300 bg-slate-800 px-1 rounded text-xs">MASTER_USERNAME</code> or <code className="text-amber-300 bg-slate-800 px-1 rounded text-xs">DEFAULT_ADMIN_USERNAME</code></li>
                    <li>Update <code className="text-amber-300 bg-slate-800 px-1 rounded text-xs">MASTER_PASSWORD</code> or <code className="text-amber-300 bg-slate-800 px-1 rounded text-xs">DEFAULT_ADMIN_PASSWORD</code></li>
                    <li>Restart the application for changes to take effect</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Manager Account Info (Site Manager only) */}
      {!isMaster && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Site Manager Account</h2>
              <p className="text-xs text-slate-500">Your account is managed by the Master user</p>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-teal-400/5 border border-teal-400/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-teal-400">Account Management</p>
                  <p className="text-slate-400">
                    Your Site Manager account credentials and site assignment are managed by the Master (CEO) user. To change your password or site assignment, contact the system administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Environment Variables</h2>
            <p className="text-xs text-slate-500">Required configuration keys</p>
          </div>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            {
              key: 'NEXT_PUBLIC_SUPABASE_URL',
              desc: 'Your Supabase project URL',
              required: true,
              source: 'Supabase Dashboard > Project Settings > API',
            },
            {
              key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
              desc: 'Supabase anonymous (public) key',
              required: true,
              source: 'Supabase Dashboard > Project Settings > API',
            },
            {
              key: 'SUPABASE_SERVICE_ROLE_KEY',
              desc: 'Supabase service role key (server-side only)',
              required: false,
              source: 'Supabase Dashboard > Project Settings > API',
            },
            {
              key: 'MASTER_USERNAME / DEFAULT_ADMIN_USERNAME',
              desc: 'Master login username',
              required: true,
              source: '.env file',
            },
            {
              key: 'MASTER_PASSWORD / DEFAULT_ADMIN_PASSWORD',
              desc: 'Master login password',
              required: true,
              source: '.env file',
            },
            {
              key: 'SESSION_SECRET',
              desc: 'Secret used to sign session tokens',
              required: false,
              source: '.env file - generate a random 32+ char string',
            },
          ].map(({ key, desc, required, source }) => (
            <div key={key} className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
                    {key}
                  </code>
                  {required && (
                    <span className="text-xs text-red-400 font-medium">Required</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{desc}</p>
                <p className="text-xs text-slate-600 mt-0.5">Source: {source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Security Notes</h2>
            <p className="text-xs text-slate-500">Best practices for this system</p>
          </div>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-sm text-slate-400">
            {[
              'Never share your .env file or commit it to version control',
              'Use a strong, unique password for the master account (min. 12 characters)',
              'The SUPABASE_SERVICE_ROLE_KEY is server-side only and must never be exposed to the browser',
              'Sessions expire after 7 days and are secured with httpOnly cookies',
              'All API routes verify the session cookie before processing requests',
              'File uploads are validated for type and size (max 10MB) before storage',
              'Site Managers can only access data belonging to their assigned site',
              'Route protection prevents Site Managers from accessing admin-only pages',
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon, label, value, description, masked,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  masked?: boolean;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-medium text-slate-300">{label}</p>
      </div>
      <code className="text-sm font-mono text-amber-300 block">{value}</code>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  );
}

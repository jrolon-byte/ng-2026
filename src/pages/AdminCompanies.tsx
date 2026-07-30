import { Fragment, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminCompanyCreateForm from '../components/AdminCompanyCreateForm';
import { getOrgs } from '../services/orgs';
import {
  listCompanies,
  updateCompany,
  setCompanyActive,
  type AdminCompany,
  type CompanyPlan,
} from '../services/admin';

/**
 * Super-admin company management: the full roster (including deactivated),
 * create, edit (profile + plan), deactivate/reactivate. UI gate is the same
 * data-driven signal as everywhere else (server returns >1 org only for
 * super admins); every function enforces its own 403.
 *
 * This page is the foundation for the referral program: referral links,
 * per-referral discounts, and "free at 5-10 referrals" will hang off this
 * roster once billing mechanics land.
 */

const PLAN_LIMIT_TO_NAME: Record<number, string> = {
  600: 'Starter',
  1500: 'Pro',
  4000: 'Enterprise',
};

function planLabel(c: AdminCompany): string {
  if (c.plan_status === 'first_blast') return 'First Blast';
  if (c.plan_status === 'cancelled') return 'Cancelled';
  if (c.plan_status === 'past_due') return 'Past due';
  const name = c.has_stripe ? (PLAN_LIMIT_TO_NAME[c.text_limit] ?? 'Custom') : 'Comped';
  return `${name} · ${c.text_limit.toLocaleString()}/mo`;
}

interface EditState {
  name: string;
  phone: string;
  locale: 'en' | 'es';
  plan: CompanyPlan | '';
  text_limit: number;
}

export default function AdminCompanies() {
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrgs()
      .then((orgs) => setIsAdmin(orgs.length > 1))
      .catch(() => setIsAdmin(false))
      .finally(() => setAdminChecked(true));
  }, []);

  const refresh = async () => {
    try {
      setCompanies(await listCompanies());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (c: AdminCompany) => {
    setEditingId(c.id);
    setEdit({
      name: c.name,
      phone: c.phone ?? '',
      locale: c.locale,
      // Plan is only sent if the admin actually picks one — '' = leave as-is,
      // so editing a name never accidentally rewrites billing state.
      plan: '',
      text_limit: c.text_limit,
    });
  };

  const saveEdit = async (c: AdminCompany) => {
    if (!edit) return;
    setSaving(true);
    try {
      await updateCompany({
        org_id: c.id,
        name: edit.name.trim(),
        phone: edit.phone.trim(),
        locale: edit.locale,
        ...(edit.plan
          ? { plan: edit.plan, text_limit: edit.plan === 'comped' ? edit.text_limit : undefined }
          : {}),
      });
      setEditingId(null);
      setEdit(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: AdminCompany) => {
    const verb = c.active ? 'Deactivate' : 'Reactivate';
    const detail = c.active
      ? 'They will not be able to log in or send texts. History stays intact.'
      : 'They will be able to log in and send again.';
    if (!confirm(`${verb} ${c.name}? ${detail}`)) return;
    try {
      await setCompanyActive(c.id, !c.active);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (adminChecked && !isAdmin) {
    return <Navigate to="/engage" replace />;
  }
  if (!adminChecked) return null;

  return (
    <Layout>
      <div className="admin-section">
        <div className="companies-header">
          <div>
            <h2>Companies</h2>
            <p className="admin-subtitle">
              {companies.length} compan{companies.length === 1 ? 'y' : 'ies'} — every org on the
              platform, including deactivated.
            </p>
          </div>
          <button
            type="button"
            className="gift-submit"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? 'Close' : '+ New company'}
          </button>
        </div>

        {showCreate && (
          <div className="companies-create">
            <AdminCompanyCreateForm onCreated={refresh} />
          </div>
        )}

        {error && <div className="gift-error">{error}</div>}

        {loading ? null : (
          <div className="companies-table-wrap">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Login</th>
                  <th>Plan</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <Fragment key={c.id}>
                    <tr className={c.active ? '' : 'companies-row--inactive'}>
                      <td>
                        <div className="companies-name">{c.name}</div>
                        <div className="companies-slug">{c.slug}</div>
                      </td>
                      <td>{c.username ?? <span className="companies-dim">—</span>}</td>
                      <td>
                        {planLabel(c)}
                        {c.bonus_extra_texts > 0 && (
                          <span
                            className="companies-bonus"
                            title={`Gift: +${c.bonus_extra_texts} texts`}
                          >
                            🎁
                          </span>
                        )}
                      </td>
                      <td>
                        {c.texts_this_month.toLocaleString()}
                        <span className="companies-dim"> / {c.text_limit.toLocaleString()}</span>
                      </td>
                      <td>
                        {c.active ? (
                          <span className="companies-badge companies-badge--active">Active</span>
                        ) : (
                          <span className="companies-badge companies-badge--off">Deactivated</span>
                        )}
                      </td>
                      <td className="companies-dim">
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="companies-actions">
                        <button type="button" className="companies-btn" onClick={() => startEdit(c)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`companies-btn ${c.active ? 'companies-btn--danger' : 'companies-btn--good'}`}
                          onClick={() => toggleActive(c)}
                        >
                          {c.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                    {editingId === c.id && edit && (
                      <tr className="companies-edit-row">
                        <td colSpan={7}>
                          <div className="gift-form-row">
                            <label className="gift-field">
                              <span>Business name</span>
                              <input
                                value={edit.name}
                                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                              />
                            </label>
                            <label className="gift-field">
                              <span>Phone</span>
                              <input
                                value={edit.phone}
                                onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                              />
                            </label>
                            <label className="gift-field">
                              <span>Language</span>
                              <select
                                value={edit.locale}
                                onChange={(e) =>
                                  setEdit({ ...edit, locale: e.target.value as 'en' | 'es' })
                                }
                              >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                              </select>
                            </label>
                            <label className="gift-field">
                              <span>Plan</span>
                              <select
                                value={edit.plan}
                                onChange={(e) =>
                                  setEdit({ ...edit, plan: e.target.value as CompanyPlan | '' })
                                }
                              >
                                <option value="">Keep current</option>
                                <option value="comped">Comped (custom limit)</option>
                                <option value="starter">Starter — 600/mo</option>
                                <option value="pro">Pro — 1,500/mo</option>
                                <option value="enterprise">Enterprise — 4,000/mo</option>
                              </select>
                            </label>
                            {edit.plan === 'comped' && (
                              <label className="gift-field">
                                <span>Text limit</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100000}
                                  value={edit.text_limit}
                                  onChange={(e) =>
                                    setEdit({ ...edit, text_limit: Number(e.target.value) })
                                  }
                                />
                              </label>
                            )}
                          </div>
                          <div className="newco-actions">
                            <button
                              type="button"
                              className="gift-submit"
                              disabled={saving}
                              onClick={() => saveEdit(c)}
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="newco-again"
                              onClick={() => {
                                setEditingId(null);
                                setEdit(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

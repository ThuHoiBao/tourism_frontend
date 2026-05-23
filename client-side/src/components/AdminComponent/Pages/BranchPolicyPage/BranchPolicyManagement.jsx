import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, FileText, Plus, Search, Edit, Trash2, Phone, Mail, MapPin,
  Award, ChevronDown, ChevronUp, Download, AlertTriangle, X, Filter,
  Briefcase, ShieldCheck, TrendingUp, Layers, CheckCircle2, Hash
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './BranchPolicyManagement.module.scss';
import BranchModal from './BranchModal/BranchModal';
import PolicyModal from './PolicyModal/PolicyModal';

const POLICY_FIELDS = [
  { key: 'tourPriceIncludes',           label: 'Giá tour bao gồm' },
  { key: 'tourPriceExcludes',           label: 'Giá không bao gồm' },
  { key: 'childPricingNotes',           label: 'Chính sách trẻ em' },
  { key: 'paymentConditions',           label: 'Điều kiện thanh toán' },
  { key: 'registrationConditions',      label: 'Điều kiện đăng ký' },
  { key: 'regularDayCancellationRules', label: 'Hủy tour ngày thường' },
  { key: 'holidayCancellationRules',    label: 'Hủy tour Lễ/Tết' },
  { key: 'forceMajeureRules',           label: 'Trường hợp bất khả kháng' },
  { key: 'packingList',                 label: 'Lưu ý vật dụng mang theo' },
];

// ── Confirm modal đẹp ────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ open, title, message, onCancel, onConfirm, busy }) => {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}><AlertTriangle size={22} /></div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnGhost} onClick={onCancel} disabled={busy}>Hủy</button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mỗi section accordion trong policy card ──────────────────────────────
const PolicySectionItem = ({ label, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!content) return null;
  return (
    <div className={`${styles.policySection} ${isOpen ? styles.policySectionOpen : ''}`}>
      <button
        type="button"
        className={styles.policySectionHeader}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.policySectionTitle}>
          <CheckCircle2 size={12} /> {label}
        </span>
        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {isOpen && (
        <div className={styles.policySectionContent}>
          <div className={styles.htmlContent}
               dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  );
};

const BranchPolicyManagement = () => {
  const [activeTab, setActiveTab] = useState('branches');

  // Branches state
  const [branches, setBranches]               = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchSearch, setBranchSearch]       = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch]     = useState(null);
  const [branchFilter, setBranchFilter]       = useState('all'); // all | head | other

  // Policies state
  const [policies, setPolicies]               = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policySearch, setPolicySearch]       = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy]     = useState(null);

  // Confirm
  const [confirm, setConfirm] = useState({ open: false, kind: null, id: null, name: null, busy: false });

  // Fetch on tab change
  useEffect(() => {
    if (activeTab === 'branches') fetchBranches();
    else fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const endpoint = branchSearch
        ? `/admin/branches/search?keyword=${encodeURIComponent(branchSearch)}&size=100`
        : '/admin/branches?size=100';
      const res = await axios.get(endpoint);
      setBranches(res.data.content || []);
    } catch {
      toast.error('Không thể tải danh sách chi nhánh');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const endpoint = policySearch
        ? `/admin/policy-templates/search?keyword=${encodeURIComponent(policySearch)}&size=100`
        : '/admin/policy-templates?size=100';
      const res = await axios.get(endpoint);
      setPolicies(res.data.content || []);
    } catch {
      toast.error('Không thể tải danh sách policy templates');
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Confirm delete dispatch
  const askDeleteBranch = (b) => setConfirm({
    open: true, kind: 'branch', id: b.contactID, name: b.branchName, busy: false
  });
  const askDeletePolicy = (p) => setConfirm({
    open: true, kind: 'policy', id: p.policyTemplateID, name: p.templateName, busy: false
  });

  const doDelete = async () => {
    setConfirm(c => ({ ...c, busy: true }));
    try {
      if (confirm.kind === 'branch') {
        await axios.delete(`/admin/branches/${confirm.id}`);
        toast.success(`Đã xóa chi nhánh "${confirm.name}"`);
        fetchBranches();
      } else {
        await axios.delete(`/admin/policy-templates/${confirm.id}`);
        toast.success(`Đã xóa policy "${confirm.name}"`);
        fetchPolicies();
      }
      setConfirm({ open: false, kind: null, id: null, name: null, busy: false });
    } catch (err) {
      toast.error(err.response?.data?.message
        || (confirm.kind === 'branch' ? 'Không thể xóa chi nhánh' : 'Không thể xóa policy'));
      setConfirm(c => ({ ...c, busy: false }));
    }
  };

  // ── Filtered + sorted branches ────────────────────────────────────────
  const displayedBranches = useMemo(() => {
    let list = branches;
    if (branchFilter === 'head')   list = list.filter(b => b.isHeadOffice);
    if (branchFilter === 'other')  list = list.filter(b => !b.isHeadOffice);
    return list;
  }, [branches, branchFilter]);

  // ── Export CSV ────────────────────────────────────────────────────────
  const exportBranchesCsv = () => {
    if (displayedBranches.length === 0) { toast.info('Không có dữ liệu'); return; }
    const rows = [
      ['ID', 'Chi nhánh', 'Trụ sở chính?', 'Điện thoại', 'Email', 'Địa chỉ', 'Số policy'],
      ...displayedBranches.map(b => [
        b.contactID, b.branchName, b.isHeadOffice ? 'Có' : 'Không',
        b.phone || '', b.email || '', b.address || '', b.policyCount || 0
      ])
    ];
    download(rows, `branches-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPoliciesCsv = () => {
    if (policies.length === 0) { toast.info('Không có dữ liệu'); return; }
    const rows = [
      ['ID', 'Tên policy', 'Chi nhánh', 'Số tour đang dùng'],
      ...policies.map(p => [
        p.policyTemplateID, p.templateName,
        p.branchInfo?.branchName || '—',
        p.usageCount || 0
      ])
    ];
    download(rows, `policies-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const download = (rows, filename) => {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const branchStats = useMemo(() => ({
    total:    branches.length,
    head:     branches.filter(b => b.isHeadOffice).length,
    other:    branches.filter(b => !b.isHeadOffice).length,
    totalPolicies: branches.reduce((s, b) => s + (b.policyCount || 0), 0),
  }), [branches]);

  const policyStats = useMemo(() => {
    const totalUsage = policies.reduce((s, p) => s + (p.usageCount || 0), 0);
    const unused = policies.filter(p => !p.usageCount).length;
    const linked = policies.filter(p => p.branchInfo).length;
    return { total: policies.length, totalUsage, unused, linked };
  }, [policies]);

  return (
    <div className={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleIcon}><Briefcase size={22} /></div>
          <div>
            <h1>Chi nhánh & Chính sách</h1>
            <p>Quản lý văn phòng và mẫu chính sách áp dụng cho tour</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost}
            onClick={activeTab === 'branches' ? exportBranchesCsv : exportPoliciesCsv}>
            <Download size={15} /> Xuất CSV
          </button>
          {activeTab === 'branches' ? (
            <button className={styles.btnPrimary}
              onClick={() => { setEditingBranch(null); setShowBranchModal(true); }}>
              <Plus size={16} /> Thêm chi nhánh
            </button>
          ) : (
            <button className={styles.btnPrimary}
              onClick={() => { setEditingPolicy(null); setShowPolicyModal(true); }}>
              <Plus size={16} /> Thêm policy
            </button>
          )}
        </div>
      </header>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'branches' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <Building2 size={16} /> Chi nhánh
          <span className={styles.tabCount}>{branches.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'policies' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileText size={16} /> Policy Templates
          <span className={styles.tabCount}>{policies.length}</span>
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────── */}
      {activeTab === 'branches' ? (
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statBlue}`}><Building2 size={20} /></div>
            <div>
              <div className={styles.statLabel}>Tổng chi nhánh</div>
              <div className={styles.statValue}>{branchStats.total}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statAmber}`}><Award size={20} /></div>
            <div>
              <div className={styles.statLabel}>Trụ sở chính</div>
              <div className={styles.statValue}>{branchStats.head}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statGreen}`}><MapPin size={20} /></div>
            <div>
              <div className={styles.statLabel}>Chi nhánh khác</div>
              <div className={styles.statValue}>{branchStats.other}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statPurple}`}><FileText size={20} /></div>
            <div>
              <div className={styles.statLabel}>Tổng policy</div>
              <div className={styles.statValue}>{branchStats.totalPolicies}</div>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statBlue}`}><FileText size={20} /></div>
            <div>
              <div className={styles.statLabel}>Tổng policy</div>
              <div className={styles.statValue}>{policyStats.total}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statGreen}`}><Layers size={20} /></div>
            <div>
              <div className={styles.statLabel}>Đã gắn chi nhánh</div>
              <div className={styles.statValue}>{policyStats.linked}</div>
              <div className={styles.statHint}>{policyStats.total - policyStats.linked} chưa gắn</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statAmber}`}><TrendingUp size={20} /></div>
            <div>
              <div className={styles.statLabel}>Tour đang áp dụng</div>
              <div className={styles.statValue}>{policyStats.totalUsage}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statRed}`}><ShieldCheck size={20} /></div>
            <div>
              <div className={styles.statLabel}>Chưa dùng</div>
              <div className={styles.statValue}>{policyStats.unused}</div>
              <div className={styles.statHint}>policy nháp / chưa active</div>
            </div>
          </div>
        </section>
      )}

      {/* ── BRANCHES TAB ─────────────────────────────────────── */}
      {activeTab === 'branches' && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Tìm theo tên, địa chỉ, điện thoại…"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBranches()}
              />
              {branchSearch && (
                <button className={styles.clearBtn} onClick={() => { setBranchSearch(''); setTimeout(fetchBranches, 0); }}>
                  <X size={13} />
                </button>
              )}
              <button className={styles.searchBtn} onClick={fetchBranches}>Tìm</button>
            </div>
            <div className={styles.filterGroup}>
              <Filter size={13} />
              <div className={styles.segmented}>
                {[
                  { v: 'all',   label: 'Tất cả' },
                  { v: 'head',  label: 'Trụ sở chính' },
                  { v: 'other', label: 'Chi nhánh khác' },
                ].map(o => (
                  <button key={o.v}
                    className={branchFilter === o.v ? styles.segActive : ''}
                    onClick={() => setBranchFilter(o.v)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {branchesLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} /> <p>Đang tải chi nhánh…</p>
            </div>
          ) : displayedBranches.length === 0 ? (
            <div className={styles.empty}>
              <Building2 size={52} />
              <h3>Chưa có chi nhánh nào</h3>
              <p>Thêm chi nhánh đầu tiên để bắt đầu</p>
              <button className={styles.btnPrimary}
                onClick={() => { setEditingBranch(null); setShowBranchModal(true); }}>
                <Plus size={15} /> Thêm chi nhánh đầu tiên
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {displayedBranches.map((b, idx) => (
                <div key={b.contactID} className={styles.card}
                     style={{ animationDelay: `${Math.min(idx * 0.03, 0.25)}s` }}>
                  {b.isHeadOffice && (
                    <div className={styles.headBadge}>
                      <Award size={12} /> Trụ sở chính
                    </div>
                  )}

                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      <Building2 size={18} />
                    </div>
                    <h3>{b.branchName}</h3>
                  </div>

                  <div className={styles.info}>
                    {b.phone && (
                      <div className={styles.infoItem}>
                        <Phone size={13} /> <span>{b.phone}</span>
                      </div>
                    )}
                    {b.email && (
                      <div className={styles.infoItem}>
                        <Mail size={13} /> <span>{b.email}</span>
                      </div>
                    )}
                    {b.address && (
                      <div className={styles.infoItem}>
                        <MapPin size={13} /> <span>{b.address}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.usageChip}>
                      <FileText size={11} /> {b.policyCount || 0} policy
                    </span>
                    <div className={styles.cardActions}>
                      <button className={styles.btnEdit} title="Chỉnh sửa"
                        onClick={() => { setEditingBranch(b); setShowBranchModal(true); }}>
                        <Edit size={14} />
                      </button>
                      <button className={styles.btnDelete} title="Xóa"
                        onClick={() => askDeleteBranch(b)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── POLICIES TAB ─────────────────────────────────────── */}
      {activeTab === 'policies' && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Tìm policy theo tên…"
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPolicies()}
              />
              {policySearch && (
                <button className={styles.clearBtn} onClick={() => { setPolicySearch(''); setTimeout(fetchPolicies, 0); }}>
                  <X size={13} />
                </button>
              )}
              <button className={styles.searchBtn} onClick={fetchPolicies}>Tìm</button>
            </div>
          </div>

          {policiesLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} /> <p>Đang tải policy templates…</p>
            </div>
          ) : policies.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={52} />
              <h3>Chưa có policy template nào</h3>
              <p>Tạo template đầu tiên để áp dụng cho tour</p>
              <button className={styles.btnPrimary}
                onClick={() => { setEditingPolicy(null); setShowPolicyModal(true); }}>
                <Plus size={15} /> Tạo policy đầu tiên
              </button>
            </div>
          ) : (
            <div className={styles.policyList}>
              {policies.map((policy, idx) => {
                const filledCount = POLICY_FIELDS.filter(f => policy[f.key]).length;
                return (
                  <div key={policy.policyTemplateID}
                       className={styles.policyCard}
                       style={{ animationDelay: `${Math.min(idx * 0.03, 0.25)}s` }}>
                    <div className={styles.policyHeader}>
                      <div className={styles.policyTitleArea}>
                        <div className={styles.policyTitleIcon}><FileText size={16} /></div>
                        <div>
                          <h3>{policy.templateName}</h3>
                          <div className={styles.policyMeta}>
                            <span className={styles.branchTag}>
                              <Building2 size={11} />
                              {policy.branchInfo?.branchName || (
                                <em className={styles.unlinked}>Chưa gắn chi nhánh</em>
                              )}
                            </span>
                            <span className={styles.idChip}>
                              <Hash size={10} /> {policy.policyTemplateID}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.policyHeaderRight}>
                        <span className={styles.usageBig}
                              title={`${policy.usageCount || 0} tour đang dùng template này`}>
                          <strong>{policy.usageCount || 0}</strong>
                          <small>tour</small>
                        </span>
                        <span className={styles.completeChip}
                              title={`${filledCount}/${POLICY_FIELDS.length} điều khoản đã điền`}>
                          {filledCount}/{POLICY_FIELDS.length}
                        </span>
                        <div className={styles.policyActions}>
                          <button className={styles.btnEdit} title="Chỉnh sửa"
                            onClick={() => { setEditingPolicy(policy); setShowPolicyModal(true); }}>
                            <Edit size={14} />
                          </button>
                          <button className={styles.btnDelete} title="Xóa"
                            onClick={() => askDeletePolicy(policy)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Accordion sections */}
                    <div className={styles.policyAccordionList}>
                      {POLICY_FIELDS.map((field) => (
                        <PolicySectionItem
                          key={field.key}
                          label={field.label}
                          content={policy[field.key]}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────── */}
      {showBranchModal && (
        <BranchModal
          isOpen={showBranchModal}
          onClose={() => { setShowBranchModal(false); setEditingBranch(null); }}
          onSuccess={() => { setShowBranchModal(false); setEditingBranch(null); fetchBranches(); }}
          editingBranch={editingBranch}
        />
      )}

      {showPolicyModal && (
        <PolicyModal
          key={editingPolicy ? editingPolicy.policyTemplateID : 'create'}
          isOpen={showPolicyModal}
          onClose={() => { setShowPolicyModal(false); setEditingPolicy(null); }}
          onSuccess={() => { setShowPolicyModal(false); setEditingPolicy(null); fetchPolicies(); }}
          editingPolicy={editingPolicy}
          branches={branches}
        />
      )}

      <ConfirmDeleteModal
        open={confirm.open}
        title={confirm.kind === 'branch' ? `Xóa chi nhánh "${confirm.name}"?` : `Xóa policy "${confirm.name}"?`}
        message={confirm.kind === 'branch'
          ? 'Hành động này không thể hoàn tác. Các policy đang gắn vào chi nhánh có thể bị ảnh hưởng.'
          : 'Hành động này không thể hoàn tác. Tour đang áp dụng policy này có thể bị ảnh hưởng.'}
        busy={confirm.busy}
        onCancel={() => setConfirm({ open: false, kind: null, id: null, name: null, busy: false })}
        onConfirm={doDelete}
      />
    </div>
  );
};

export default BranchPolicyManagement;

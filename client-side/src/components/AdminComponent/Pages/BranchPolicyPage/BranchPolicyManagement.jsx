import React, { useState, useEffect } from 'react';
import { 
  Building2, FileText, Plus, Search, Edit, Trash2, 
  Phone, Mail, MapPin, Award, ChevronDown, ChevronUp 
} from 'lucide-react'; // Thêm icon mở rộng nếu cần
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './BranchPolicyManagement.module.scss';
import BranchModal from './BranchModal/BranchModal';
import PolicyModal from './PolicyModal/PolicyModal';

// Cấu hình các trường thông tin muốn hiển thị
const POLICY_FIELDS = [
  { key: 'tourPriceIncludes', label: 'Giá tour bao gồm' },
  { key: 'tourPriceExcludes', label: 'Giá không bao gồm' },
  { key: 'childPricingNotes', label: 'Chính sách trẻ em' },
  { key: 'paymentConditions', label: 'Điều kiện thanh toán' },
  { key: 'registrationConditions', label: 'Điều kiện đăng ký' },
  { key: 'regularDayCancellationRules', label: 'Hủy tour ngày thường' },
  { key: 'holidayCancellationRules', label: 'Hủy tour Lễ/Tết' },
  { key: 'forceMajeureRules', label: 'Trường hợp bất khả kháng' },
  { key: 'packingList', label: 'Lưu ý vật dụng mang theo' }
];

const BranchPolicyManagement = () => {
  const [activeTab, setActiveTab] = useState('branches');
  // Branches state
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  
  // Policies state
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policySearch, setPolicySearch] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  // Fetch data (Giữ nguyên logic cũ)
  useEffect(() => {
    if (activeTab === 'branches') {
      fetchBranches();
    } else {
      fetchPolicies();
    }
  }, [activeTab]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const endpoint = branchSearch 
        ? `/admin/branches/search?keyword=${branchSearch}&size=100`
        : '/admin/branches?size=100';
      const res = await axios.get(endpoint);
      setBranches(res.data.content || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Không thể tải danh sách chi nhánh');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const endpoint = policySearch
        ? `/admin/policy-templates/search?keyword=${policySearch}&size=100`
        : '/admin/policy-templates?size=100';
      const res = await axios.get(endpoint);
      setPolicies(res.data.content || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Không thể tải danh sách policy templates');
    } finally {
      setPoliciesLoading(false);
    }
  };

  const handleDeleteBranch = async (contactID, branchName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chi nhánh "${branchName}"?`)) return;
    try {
      await axios.delete(`/admin/branches/${contactID}`);
      toast.success('Xóa chi nhánh thành công!');
      fetchBranches();
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xóa chi nhánh';
      toast.error(msg);
    }
  };

  const handleDeletePolicy = async (policyTemplateID, templateName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa policy template "${templateName}"?`)) return;
    try {
      await axios.delete(`/admin/policy-templates/${policyTemplateID}`);
      toast.success('Xóa policy template thành công!');
      fetchPolicies();
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xóa policy template';
      toast.error(msg);
    }
  };


  const PolicySectionItem = ({ label, content }) => {
    const [isOpen, setIsOpen] = useState(false); 

    if (!content) return null; 

    return (
      <div className={`${styles.policySection} ${isOpen ? styles.open : ''}`}>
        <div 
          className={styles.sectionHeader} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.sectionTitle}>{label}</span>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isOpen && (
          <div className={styles.sectionContent}>
            <div 
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          </div>
        )}
      </div>
    );
};


  return (
    <div className={styles.container}>
      {/* Header & Tabs giữ nguyên */}
      <div className={styles.header}>
        <div>
          <h1>Quản lý Chi nhánh & Chính sách</h1>
          <p>Quản lý thông tin liên hệ chi nhánh và mẫu chính sách tour</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'branches' ? styles.active : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <Building2 size={18} /> Chi nhánh ({branches.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'policies' ? styles.active : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileText size={18} /> Policy Templates ({policies.length})
        </button>
      </div>

      {/* Branch Management (Giữ nguyên) */}
      {activeTab === 'branches' && (
        <div className={styles.content}>
           {/* ... Code phần Branch giữ nguyên như cũ ... */}
           {/* Copy lại phần render Branch từ code cũ của bạn vào đây */}
             <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm chi nhánh..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchBranches()}
              />
            </div>
            <button 
              className={styles.btnPrimary}
              onClick={() => {
                setEditingBranch(null);
                setShowBranchModal(true);
              }}
            >
              <Plus size={18} /> Thêm chi nhánh
            </button>
          </div>

          {branchesLoading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : branches.length === 0 ? (
            <div className={styles.empty}>
              <Building2 size={48} />
              <p>Chưa có chi nhánh nào</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {branches.map(branch => (
                <div key={branch.contactID} className={styles.card}>
                  {branch.isHeadOffice && (
                    <div className={styles.badge}>
                      <Award size={14} /> Trụ sở chính
                    </div>
                  )}
                  
                  <h3>{branch.branchName}</h3>
                  
                  <div className={styles.info}>
                    <div className={styles.infoItem}>
                      <Phone size={16} /> <span>{branch.phone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Mail size={16} /> <span>{branch.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <MapPin size={16} /> <span>{branch.address}</span>
                    </div>
                  </div>

                  <div className={styles.stats}>
                    <span className={styles.stat}>
                      <FileText size={14} /> {branch.policyCount} policy templates
                    </span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => {
                        setEditingBranch(branch);
                        setShowBranchModal(true);
                      }}
                    >
                      <Edit size={16} /> Sửa
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDeleteBranch(branch.contactID, branch.branchName)}
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Policy Management (ĐÃ SỬA LẠI PHẦN NÀY) */}
      {activeTab === 'policies' && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm policy template..."
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchPolicies()}
              />
            </div>
            <button 
              className={styles.btnPrimary}
              onClick={() => {
                setEditingPolicy(null);
                setShowPolicyModal(true);
              }}
            >
              <Plus size={18} /> Thêm policy template
            </button>
          </div>

          {policiesLoading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : policies.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={48} />
              <p>Chưa có policy template nào</p>
            </div>
          ) : (
            <div className={styles.policyList}>
              {policies.map(policy => (
                <div key={policy.policyTemplateID} className={styles.policyCard}>
                  <div className={styles.policyHeader}>
                    <div>
                      <h3>{policy.templateName}</h3>
                      <p className={styles.branchName}>
                        <Building2 size={14} />
                        {policy.branchInfo?.branchName || 'Chưa gắn chi nhánh'}
                      </p>
                    </div>
                    <div className={styles.policyActions}>
                      <span className={styles.usageCount}>
                        Đang dùng cho: <strong>{policy.usageCount || 0}</strong> tour
                      </span>
                      <button
                        className={styles.btnIcon}
                        onClick={() => {
                          setEditingPolicy(policy);
                          setShowPolicyModal(true);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className={styles.btnIconDanger}
                        onClick={() => handleDeletePolicy(policy.policyTemplateID, policy.templateName)}
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Render danh sách các điều khoản */}
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals giữ nguyên */}
      {showBranchModal && (
        <BranchModal
          isOpen={showBranchModal}
          onClose={() => {
            setShowBranchModal(false);
            setEditingBranch(null);
          }}
          onSuccess={() => {
            setShowBranchModal(false);
            setEditingBranch(null);
            fetchBranches();
          }}
          editingBranch={editingBranch}
        />
      )}

      {showPolicyModal && (
        <PolicyModal
          key={editingPolicy ? editingPolicy.policyTemplateID : 'create'}
          isOpen={showPolicyModal}
          onClose={() => {
            setShowPolicyModal(false);
            setEditingPolicy(null);
          }}
          onSuccess={() => {
            setShowPolicyModal(false);
            setEditingPolicy(null);
            fetchPolicies();
          }}
          editingPolicy={editingPolicy}
          branches={branches}
        />
      )}
    </div>
  );
};

export default BranchPolicyManagement;
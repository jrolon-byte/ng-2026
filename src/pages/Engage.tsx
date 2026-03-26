import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContacts, createContact, deleteContact } from '../services/contacts';
import { sendCampaign } from '../services/campaigns';
import type { Contact } from '../types';
import { formatPhone } from '../utils/formatPhone';
import { formatPhoneInput } from '../utils/formatPhoneInput';
import TopNav from '../components/TopNav';
import Loader from '../components/Loader';
import { FaTrashAlt } from 'react-icons/fa';

export default function Engage() {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState<Contact[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add customer
  const [name, setName] = useState('');
  const [mobileNum, setMobileNum] = useState('');

  // Message
  const [message, setMessage] = useState('');
  const [showNoMessage, setShowNoMessage] = useState(false);
  const [sending, setSending] = useState(false);

  // Delete confirm per-customer
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const data = await getContacts();
      setCustomerList(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Add customer
  const onAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobileNum.trim()) {
      alert('Please enter name and mobile number');
      return;
    }

    try {
      await createContact({
        first_name: name,
        phone: mobileNum,
      });
      setName('');
      setMobileNum('');
      setShowAddCustomer(false);
      fetchCustomers();
    } catch {
      // silent
    }
  };

  // Send message
  const onSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ([0, 1, 2, 3, 4, 5].includes(message.length)) {
      setShowNoMessage(true);
      return;
    }
    setSending(true);
    try {
      await sendCampaign({ body: message });
      alert('Success! All Your clients have been outreached.');
      setMessage('');
      setShowNoMessage(false);
    } catch {
      alert('Failed to send messages. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Delete customer
  const onDelete = async (contact: Contact) => {
    try {
      await deleteContact(contact.id);
      setConfirmDeleteId(null);
      fetchCustomers();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div>
        <TopNav />
        <div className="contain">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />

      {/* Title bar */}
      <div className="contain">
        <div className="header">
          <h2>Engage</h2>
          <button
            className="btn"
            style={{ color: 'white', background: 'black' }}
            onClick={() => setShowAddCustomer(!showAddCustomer)}
          >
            {showAddCustomer ? 'Close' : 'Add New Customer'}
          </button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddCustomer && (
        <div className="contain">
          <div>
            <h3>Add Customer</h3>
            <form className="add-form">
              <div className="form-control">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-control">
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={mobileNum}
                  onChange={(e) => setMobileNum(formatPhoneInput(e.target.value))}
                  maxLength={14}
                />
              </div>
              <button
                onClick={onAddCustomer}
                className="btn btn-block"
                style={{ color: 'white', background: 'black' }}
              >
                Add New Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Textarea / Send */}
      <div className="contain">
        <form className="engagement-form">
          <div className="form-control">
            <textarea
              placeholder="Engage your customer list to bring them through your door."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (showNoMessage) setShowNoMessage(false);
              }}
              rows={10}
            />
            {showNoMessage && (
              <p className="errorText">
                Do you really want to text {customerList.length} customers
                nothing? Type an engaging message to bring them through your
                door!
              </p>
            )}
          </div>

          {sending ? (
            <Loader />
          ) : (
            <button
              onClick={onSendMessage}
              className="btn btn-blue"
              style={{ color: 'white', background: '#3399ff' }}
            >
              Send Mass Text 📲
            </button>
          )}
        </form>
      </div>

      {/* Customer List */}
      <div className="contain">
        {customerList.length > 0 ? (
          <>
            <small>{customerList.length} customers</small>
            {customerList.map((customer) => (
              <div key={customer.id}>
                {confirmDeleteId === customer.id ? (
                  // Confirm delete
                  <div className="customer confirmDelete">
                    <h3>
                      Are you sure you want to remove {customer.first_name}
                      {' as a client?'}
                    </h3>
                    <div className="btnOptions">
                      <button
                        className="btn"
                        style={{ color: 'white', background: 'black' }}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                      <button
                        className="btn"
                        style={{ color: 'white', background: 'red' }}
                        onClick={() => onDelete(customer)}
                      >
                        Yes
                      </button>
                    </div>
                    {customer.created_at && (
                      <small className="floatRight">
                        Member since:&nbsp;
                        {new Date(customer.created_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                ) : (
                  // Normal customer card
                  <div className="customer">
                    <h3>
                      {customer.first_name}
                      <FaTrashAlt
                        onClick={() => setConfirmDeleteId(customer.id)}
                        style={{ color: 'red', cursor: 'pointer' }}
                      />
                    </h3>
                    <p>{formatPhone(customer.phone)}</p>
                    {customer.created_at && (
                      <small className="floatRight">
                        Member since:&nbsp;
                        {new Date(customer.created_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <p>Add a customer to see them here.</p>
        )}
      </div>
    </div>
  );
}

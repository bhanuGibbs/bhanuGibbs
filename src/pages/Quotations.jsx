import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { deleteQuotation, getQuotations } from '../integration/backend/api';

const Quotations = () => {
  const { logout, user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleDelete = async (quotationId) => {
    const confirmed = window.confirm('Delete this quotation? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteQuotation(quotationId);
      setQuotations((current) => current.filter((item) => item.id !== quotationId));
      toast.success('Quotation deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to delete quotation');
    }
  };

  const downloadPdf = (quotation) => {
    if (!quotation?.id) return;
    window.open(`/api/quotations/${quotation.id}/pdf`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Quotations</h1>
              <p className="mt-2 text-sm text-slate-500">Review and manage all quotations saved to the backend.</p>
            </div>
            <div className="text-sm text-slate-500">
              {loading ? 'Loading…' : `${quotations.length} quotation${quotations.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{quotation.reference_number || '—'}</td>
                    <td className="px-4 py-3">{quotation.title}</td>
                    <td className="px-4 py-3">₹{Number(quotation.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{quotation.issued_at?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3">{quotation.status || 'Draft'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => downloadPdf(quotation)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
                        >
                          Download PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(quotation.id)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && quotations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                      No quotations found. Generate a quotation from the home screen to save one.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Quotations;

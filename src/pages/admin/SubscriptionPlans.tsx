import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Settings, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: string[];
  is_active: boolean;
}

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (plan: Plan) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('subscription_plans')
        .upsert({
          ...plan,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      loadPlans();
      setEditingPlan(null);
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      loadPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.user_metadata?.role === 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
          <p className="text-gray-400 mt-2">Manage subscription plans and pricing</p>
        </div>
        <button
          onClick={() => setShowNewPlanModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </header>

      {error && (
        <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
          <p className="text-sm text-trading-danger">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-gray-800 rounded-xl p-6 ${
              !plan.is_active && 'opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-trading-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  ${plan.price_monthly}
                  <span className="text-sm text-gray-400">/month</span>
                </div>
                <div className="text-sm text-gray-400">
                  ${plan.price_yearly}/year (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                </div>
              </div>

              <p className="text-gray-300">{plan.description}</p>

              <div className="space-y-2">
                <h3 className="font-medium">Features</h3>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-trading-accent"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {!plan.is_active && (
                <div className="mt-4 p-2 bg-gray-700/50 rounded text-sm text-gray-400 text-center">
                  Inactive Plan
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-6">Edit Plan</h2>
            {/* Add form fields for editing plan */}
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-6">Create New Plan</h2>
            {/* Add form fields for new plan */}
          </div>
        </div>
      )}
    </div>
  );
}
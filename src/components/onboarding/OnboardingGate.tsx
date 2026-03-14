import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listWarehouses, listCategories, listUnits, listProducts } from '@/lib/repo';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Step = {
  key: 'warehouses' | 'categories' | 'units' | 'products';
  title: string;
  body: string;
  cta: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    key: 'warehouses',
    title: 'Create your first warehouse',
    body: 'Warehouses are the places you store stock. Add one location to start tracking inventory.',
    cta: { label: 'Go to Warehouses', to: '/warehouses' },
  },
  {
    key: 'categories',
    title: 'Add product categories',
    body: 'Categories keep your catalog clean (e.g. Laptops, Consumables, Spare Parts).',
    cta: { label: 'Open Settings', to: '/settings' },
  },
  {
    key: 'units',
    title: 'Add units of measure',
    body: 'Define units like pcs, kg, box. This helps keep quantities consistent across operations.',
    cta: { label: 'Open Settings', to: '/settings' },
  },
  {
    key: 'products',
    title: 'Add your first product',
    body: 'Create a product with SKU, category, unit, reorder level, and optional initial stock.',
    cta: { label: 'Go to Products', to: '/products' },
  },
];

export default function OnboardingGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completed, complete } = useOnboardingStore();

  const [counts, setCounts] = useState({ warehouses: 0, categories: 0, units: 0, products: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (completed) return;
    setLoading(true);
    (async () => {
      try {
        const [w, c, u, p] = await Promise.all([
          listWarehouses(),
          listCategories(),
          listUnits(),
          listProducts(),
        ]);
        setCounts({ warehouses: w.length, categories: c.length, units: u.length, products: p.length });
      } finally {
        setLoading(false);
      }
    })();
  }, [completed]);

  const missing = useMemo(() => {
    return {
      warehouses: counts.warehouses === 0,
      categories: counts.categories === 0,
      units: counts.units === 0,
      products: counts.products === 0,
    };
  }, [counts]);

  const nextStep = useMemo(() => {
    if (missing.warehouses) return STEPS[0];
    if (missing.categories) return STEPS[1];
    if (missing.units) return STEPS[2];
    if (missing.products) return STEPS[3];
    return null;
  }, [missing]);

  // Auto-redirect first-time users to the right first step.
  useEffect(() => {
    if (completed) return;
    if (!nextStep) {
      complete();
      return;
    }

    // If user lands on / (Index redirects to /warehouses), don't fight navigation.
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      navigate(nextStep.cta.to, { replace: true });
    }
  }, [completed, nextStep, complete, location.pathname, navigate]);

  if (completed || !nextStep) return null;

  const progress = (Object.values(missing).filter(Boolean).length);

  return (
    <div className="sticky top-0 z-30 mb-4">
      <div className={cn(
        'card-elevated rounded-xl border border-border/60 p-4',
        'bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60'
      )}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Quick setup</p>
            <h3 className="text-foreground font-semibold mt-1">{nextStep.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{nextStep.body}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {loading ? 'Checking your setup…' : `Remaining steps: ${progress}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate(nextStep.cta.to)}>
              {nextStep.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

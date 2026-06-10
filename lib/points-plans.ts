export interface RawPointsPlan {
  id?: string;
  title?: string;
  points?: number | string;
  enabled?: boolean;
  qrCodeUrl?: string;
}

export interface NormalizedPointsPlan {
  id: string;
  title: string;
  points: number;
  enabled: boolean;
  qrCodeUrl?: string;
}

interface NormalizeOptions {
  includeDisabled?: boolean;
}

export const DEFAULT_POINTS_PLANS: NormalizedPointsPlan[] = [
  {
    id: 'plan-100',
    title: '100 點',
    points: 100,
    enabled: true,
    qrCodeUrl: '',
  },
  {
    id: 'plan-500',
    title: '500 點',
    points: 500,
    enabled: true,
    qrCodeUrl: '',
  },
  {
    id: 'plan-1000',
    title: '1000 點',
    points: 1000,
    enabled: true,
    qrCodeUrl: '',
  },
  {
    id: 'plan-2000',
    title: '2000 點',
    points: 2000,
    enabled: true,
    qrCodeUrl: '',
  },
  {
    id: 'plan-5000',
    title: '5000 點',
    points: 5000,
    enabled: true,
    qrCodeUrl: '',
  },
];

export const normalizePointsPlans = (
  plans: any[],
  options: NormalizeOptions = {},
): NormalizedPointsPlan[] => {
  const { includeDisabled = true } = options;

  if (!Array.isArray(plans)) {
    return [];
  }

  return plans
    .map((plan: RawPointsPlan, index: number) => {
      if (!plan || typeof plan !== 'object') {
        return null;
      }

      const pointsValue =
        typeof plan.points === 'number' ? plan.points : Number(plan.points);

      if (!pointsValue || Number.isNaN(pointsValue) || pointsValue <= 0) {
        return null;
      }

      const enabled = plan.enabled !== false;

      if (!includeDisabled && !enabled) {
        return null;
      }

      const trimmedTitle =
        typeof plan.title === 'string' && plan.title.trim().length > 0
          ? plan.title.trim()
          : `${Math.round(pointsValue)} 點`;

      return {
        id: plan.id || `plan-${index + 1}`,
        title: trimmedTitle,
        points: Math.round(pointsValue),
        enabled,
        qrCodeUrl: typeof plan.qrCodeUrl === 'string' ? plan.qrCodeUrl : '',
      } as NormalizedPointsPlan;
    })
    .filter((plan): plan is NormalizedPointsPlan => plan !== null)
    .sort((a, b) => a.points - b.points);
};


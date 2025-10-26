export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  seats: number;
  seatsDisplay: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  color: string;
}

export interface UpgradeSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentSeats: number;
  currentUsage: number;
  organizationId: string;
}

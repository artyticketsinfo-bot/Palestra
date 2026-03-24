export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'M' | 'F' | 'Other';
  birthDate: string;
  taxCode: string;
  address: string;
  civicNumber: string;
  zipCode: string;
  city: string;
  clientCode: string;
  registrationDate: string;
  createdBy: string;
}

export interface Membership {
  id: string;
  clientId: string;
  startDate: string;
  endDate: string;
  type: string;
  price: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  paymentStatus?: 'Paid' | 'Pending';
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  createdBy: string;
}

export interface InvoiceItem {
  description: string;
  price: number;
  quantity: number;
  serviceType: string;
}

export interface Invoice {
  id: string;
  clientId?: string;
  clientData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    taxCode: string;
    healthCard?: string;
    address: string;
    civicNumber: string;
    zipCode: string;
    city: string;
    clientCode?: string;
  };
  items: InvoiceItem[];
  date: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  total: number;
  type: 'Automatic' | 'Manual';
  notes?: string;
  issuerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    vat?: string;
  };
  createdBy: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  staffId?: string;
  trainer?: string;
  dateTime: string;
  duration: number;
  notes: string;
  service: string;
  createdBy: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'M' | 'F' | 'Other';
  birthDate: string;
  role: string;
  specialization: string;
  availability: string;
  color: string;
  active: boolean;
  hiringDate: string;
  salary: number;
  photoUrl?: string;
  createdBy: string;
}

export interface GymSettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  vat?: string;
  themeColor: string;
  logoUrl?: string;
}

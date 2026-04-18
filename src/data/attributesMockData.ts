export interface AttributeOption {
  id: string;
  value: string;
  label: string;
  colorHex?: string;
  position: number;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: 'select' | 'color' | 'size' | 'text';
  description: string;
  options: AttributeOption[];
  isRequired: boolean;
  isFilterable: boolean;
  isVisible: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export const mockAttributes: Attribute[] = [
  {
    id: 'attr-1',
    name: 'Size',
    slug: 'size',
    type: 'size',
    description: 'Product size variations',
    options: [
      { id: 'opt-1', value: 'xs', label: 'XS', position: 1 },
      { id: 'opt-2', value: 's', label: 'S', position: 2 },
      { id: 'opt-3', value: 'm', label: 'M', position: 3 },
      { id: 'opt-4', value: 'l', label: 'L', position: 4 },
      { id: 'opt-5', value: 'xl', label: 'XL', position: 5 },
      { id: 'opt-6', value: 'xxl', label: 'XXL', position: 6 },
    ],
    isRequired: false,
    isFilterable: true,
    isVisible: true,
    productCount: 45,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'attr-2',
    name: 'Color',
    slug: 'color',
    type: 'color',
    description: 'Product color options',
    options: [
      { id: 'opt-7', value: 'black', label: 'Black', colorHex: '#000000', position: 1 },
      { id: 'opt-8', value: 'white', label: 'White', colorHex: '#FFFFFF', position: 2 },
      { id: 'opt-9', value: 'red', label: 'Red', colorHex: '#EF4444', position: 3 },
      { id: 'opt-10', value: 'blue', label: 'Blue', colorHex: '#3B82F6', position: 4 },
      { id: 'opt-11', value: 'green', label: 'Green', colorHex: '#22C55E', position: 5 },
      { id: 'opt-12', value: 'yellow', label: 'Yellow', colorHex: '#EAB308', position: 6 },
      { id: 'opt-13', value: 'purple', label: 'Purple', colorHex: '#A855F7', position: 7 },
      { id: 'opt-14', value: 'pink', label: 'Pink', colorHex: '#EC4899', position: 8 },
    ],
    isRequired: false,
    isFilterable: true,
    isVisible: true,
    productCount: 62,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
  },
  {
    id: 'attr-3',
    name: 'Material',
    slug: 'material',
    type: 'select',
    description: 'Product material composition',
    options: [
      { id: 'opt-15', value: 'cotton', label: 'Cotton', position: 1 },
      { id: 'opt-16', value: 'polyester', label: 'Polyester', position: 2 },
      { id: 'opt-17', value: 'leather', label: 'Leather', position: 3 },
      { id: 'opt-18', value: 'wool', label: 'Wool', position: 4 },
      { id: 'opt-19', value: 'silk', label: 'Silk', position: 5 },
      { id: 'opt-20', value: 'denim', label: 'Denim', position: 6 },
    ],
    isRequired: false,
    isFilterable: true,
    isVisible: true,
    productCount: 38,
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
  },
  {
    id: 'attr-4',
    name: 'Capacity',
    slug: 'capacity',
    type: 'select',
    description: 'Storage or volume capacity',
    options: [
      { id: 'opt-21', value: '16gb', label: '16GB', position: 1 },
      { id: 'opt-22', value: '32gb', label: '32GB', position: 2 },
      { id: 'opt-23', value: '64gb', label: '64GB', position: 3 },
      { id: 'opt-24', value: '128gb', label: '128GB', position: 4 },
      { id: 'opt-25', value: '256gb', label: '256GB', position: 5 },
      { id: 'opt-26', value: '512gb', label: '512GB', position: 6 },
      { id: 'opt-27', value: '1tb', label: '1TB', position: 7 },
    ],
    isRequired: false,
    isFilterable: true,
    isVisible: true,
    productCount: 24,
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
  },
  {
    id: 'attr-5',
    name: 'Wattage',
    slug: 'wattage',
    type: 'select',
    description: 'Power consumption in watts',
    options: [
      { id: 'opt-28', value: '500w', label: '500W', position: 1 },
      { id: 'opt-29', value: '750w', label: '750W', position: 2 },
      { id: 'opt-30', value: '1000w', label: '1000W', position: 3 },
      { id: 'opt-31', value: '1500w', label: '1500W', position: 4 },
      { id: 'opt-32', value: '2000w', label: '2000W', position: 5 },
    ],
    isRequired: false,
    isFilterable: true,
    isVisible: true,
    productCount: 18,
    createdAt: '2024-01-16T14:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
  },
  {
    id: 'attr-6',
    name: 'Warranty',
    slug: 'warranty',
    type: 'select',
    description: 'Product warranty period',
    options: [
      { id: 'opt-33', value: '6m', label: '6 Months', position: 1 },
      { id: 'opt-34', value: '1y', label: '1 Year', position: 2 },
      { id: 'opt-35', value: '2y', label: '2 Years', position: 3 },
      { id: 'opt-36', value: '3y', label: '3 Years', position: 4 },
      { id: 'opt-37', value: '5y', label: '5 Years', position: 5 },
      { id: 'opt-38', value: 'lifetime', label: 'Lifetime', position: 6 },
    ],
    isRequired: false,
    isFilterable: false,
    isVisible: true,
    productCount: 56,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
  },
];

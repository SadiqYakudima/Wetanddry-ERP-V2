export const trucks = [
    { id: 1, plateNumber: 'ABC-123-XY', model: 'Mercedes Actros', capacity: '8m³', status: 'Available', lastMaintenance: '2025-10-15', mileage: '45,230 km' },
    { id: 2, plateNumber: 'DEF-456-ZW', model: 'Volvo FMX', capacity: '10m³', status: 'In Use', lastMaintenance: '2025-09-20', mileage: '67,890 km' },
    { id: 3, plateNumber: 'GHI-789-UV', model: 'MAN TGS', capacity: '6m³', status: 'Maintenance', lastMaintenance: '2025-11-01', mileage: '32,100 km' },
    { id: 4, plateNumber: 'JKL-012-ST', model: 'Scania P-Series', capacity: '12m³', status: 'Available', lastMaintenance: '2025-10-28', mileage: '51,450 km' },
    { id: 5, plateNumber: 'MNO-345-QR', model: 'Isuzu FVZ', capacity: '8m³', status: 'Available', lastMaintenance: '2025-11-05', mileage: '28,900 km' },
];

export const maintenanceHistory = [
    { date: '2025-11-01', type: 'Oil Change', cost: '₦45,000', status: 'Completed', notes: 'Regular maintenance' },
    { date: '2025-10-15', type: 'Tire Replacement', cost: '₦180,000', status: 'Completed', notes: 'Replaced front tires' },
    { date: '2025-09-20', type: 'Brake Service', cost: '₦95,000', status: 'Completed', notes: 'Brake pads replaced' },
];

export const parts = [
    { partNumber: 'TYR-001', name: 'Front Tire (Left)', category: 'Tire', installedDate: '2025-10-15', status: 'Active', lifespan: '2 years' },
    { partNumber: 'TYR-002', name: 'Front Tire (Right)', category: 'Tire', installedDate: '2025-10-15', status: 'Active', lifespan: '2 years' },
    { partNumber: 'BAT-001', name: 'Heavy Duty Battery', category: 'Battery', installedDate: '2025-08-10', status: 'Active', lifespan: '3 years' },
];

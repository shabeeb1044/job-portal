import type { JobCategoryGroup } from './db'

export type SeedCategory = {
  slug: string
  name: string
  emoji: string
  description: string
  group: JobCategoryGroup
  subCategories: string[]
}

export const DEFAULT_JOB_CATEGORIES: SeedCategory[] = [
  // WHITE COLLAR
  { slug: 'accounting-finance', name: 'Accounting & Finance', emoji: '📊', description: 'Finance and accounting roles', group: 'white_collar', subCategories: ['Accountant', 'Assistant Accountant', 'Auditor', 'Finance Manager', 'Accounts Clerk', 'Payroll Officer', 'Tax Consultant'] },
  { slug: 'administration-office', name: 'Administration & Office Support', emoji: '📋', description: 'Office administration and support', group: 'white_collar', subCategories: ['Office Administrator', 'Receptionist', 'Executive Secretary', 'Data Entry Clerk', 'Document Controller', 'Personal Assistant'] },
  { slug: 'hr-recruitment', name: 'Human Resources & Recruitment', emoji: '👥', description: 'HR and recruitment roles', group: 'white_collar', subCategories: ['HR Officer', 'Recruitment Specialist', 'HR Manager', 'PRO (Public Relations Officer)', 'Training Coordinator', 'HR Assistant'] },
  { slug: 'marketing-advertising-pr', name: 'Marketing, Advertising & PR', emoji: '📢', description: 'Marketing and communications', group: 'white_collar', subCategories: ['Marketing Executive', 'Digital Marketing Specialist', 'Graphic Designer', 'Social Media Manager', 'Content Writer', 'Brand Manager'] },
  { slug: 'sales-business-development', name: 'Sales & Business Development', emoji: '💼', description: 'Sales and business development', group: 'white_collar', subCategories: ['Sales Executive', 'Business Development Manager', 'Sales Coordinator', 'Key Account Manager', 'Tele Sales Executive'] },
  { slug: 'customer-service-call-center', name: 'Customer Service & Call Center', emoji: '📞', description: 'Customer support and call center', group: 'white_collar', subCategories: ['Customer Service Representative', 'Call Center Agent', 'Support Executive', 'Client Relations Officer'] },
  { slug: 'it-software', name: 'Information Technology (IT) & Software', emoji: '💻', description: 'IT and software development', group: 'white_collar', subCategories: ['IT Support Technician', 'Software Developer', 'Web Developer', 'Network Administrator', 'System Analyst', 'Database Administrator'] },
  { slug: 'engineering', name: 'Engineering', emoji: '⚙️', description: 'Engineering roles', group: 'white_collar', subCategories: ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'QA/QC Engineer', 'Project Engineer', 'Site Engineer'] },
  { slug: 'legal-compliance', name: 'Legal & Compliance', emoji: '⚖️', description: 'Legal and compliance', group: 'white_collar', subCategories: ['Legal Assistant', 'Compliance Officer', 'Corporate Lawyer', 'Contract Administrator'] },
  { slug: 'education-training', name: 'Education & Training', emoji: '📚', description: 'Education and training', group: 'white_collar', subCategories: ['Teacher', 'Lecturer', 'Academic Coordinator', 'Tutor', 'School Administrator'] },
  { slug: 'healthcare-medical', name: 'Healthcare & Medical', emoji: '🏥', description: 'Healthcare and medical', group: 'white_collar', subCategories: ['Doctor', 'Nurse', 'Pharmacist', 'Lab Technician', 'Radiographer', 'Medical Secretary'] },
  { slug: 'procurement-logistics-supply-chain', name: 'Procurement, Logistics & Supply Chain', emoji: '📦', description: 'Procurement and supply chain', group: 'white_collar', subCategories: ['Procurement Officer', 'Logistics Coordinator', 'Supply Chain Manager', 'Storekeeper', 'Inventory Controller'] },
  // BLUE COLLAR
  { slug: 'drivers', name: 'Drivers', emoji: '🚗', description: 'Driving and vehicle operation', group: 'blue_collar', subCategories: ['Light Vehicle Driver', 'Heavy Vehicle Driver', 'Forklift Operator', 'Bus Driver', 'Delivery Driver'] },
  { slug: 'electricians', name: 'Electricians', emoji: '⚡', description: 'Electrical work', group: 'blue_collar', subCategories: ['Industrial Electrician', 'Building Electrician', 'Maintenance Electrician', 'Assistant Electrician'] },
  { slug: 'plumbers', name: 'Plumbers', emoji: '🔧', description: 'Plumbing and pipe fitting', group: 'blue_collar', subCategories: ['Pipe Fitter', 'Maintenance Plumber', 'Sanitary Installer'] },
  { slug: 'carpenters', name: 'Carpenters', emoji: '🪚', description: 'Carpentry and woodwork', group: 'blue_collar', subCategories: ['Shuttering Carpenter', 'Finishing Carpenter', 'Furniture Carpenter'] },
  { slug: 'welders-fabricators', name: 'Welders & Fabricators', emoji: '🔥', description: 'Welding and fabrication', group: 'blue_collar', subCategories: ['Arc Welder', 'MIG/TIG Welder', 'Steel Fabricator'] },
  { slug: 'mechanics-technicians', name: 'Mechanics & Technicians', emoji: '🔩', description: 'Mechanical and technical work', group: 'blue_collar', subCategories: ['Auto Mechanic', 'AC Technician', 'Diesel Mechanic', 'Generator Technician'] },
  { slug: 'masons-construction', name: 'Masons & Construction Workers', emoji: '🧱', description: 'Masonry and construction', group: 'blue_collar', subCategories: ['Mason', 'Steel Fixer', 'Scaffolder', 'Construction Helper'] },
  { slug: 'factory-production', name: 'Factory & Production Workers', emoji: '🏭', description: 'Factory and production', group: 'blue_collar', subCategories: ['Machine Operator', 'Production Worker', 'Packing Worker'] },
  { slug: 'cleaners-housekeeping', name: 'Cleaners & Housekeeping', emoji: '🧹', description: 'Cleaning and housekeeping', group: 'blue_collar', subCategories: ['Office Cleaner', 'Housekeeper', 'Janitor'] },
  { slug: 'security-guards', name: 'Security Guards', emoji: '🛡️', description: 'Security and surveillance', group: 'blue_collar', subCategories: ['Security Guard', 'CCTV Operator', 'Watchman'] },
  { slug: 'maintenance-workers', name: 'Maintenance Workers', emoji: '🔨', description: 'General maintenance', group: 'blue_collar', subCategories: ['General Maintenance Worker', 'Facility Technician', 'Building Maintenance Assistant'] },
  // OTHER
  { slug: 'hospitality-tourism', name: 'Hospitality & Tourism', emoji: '🏨', description: 'Hospitality and tourism', group: 'other', subCategories: ['Waiter / Waitress', 'Chef / Cook', 'Barista', 'Hotel Receptionist', 'Room Attendant'] },
  { slug: 'aviation', name: 'Aviation', emoji: '✈️', description: 'Aviation industry', group: 'other', subCategories: ['Ground Staff', 'Baggage Handler', 'Cabin Crew', 'Aircraft Cleaner'] },
  { slug: 'marine-offshore', name: 'Marine & Offshore', emoji: '🚢', description: 'Marine and offshore', group: 'other', subCategories: ['Seaman', 'Deck Officer', 'Marine Engineer', 'Offshore Technician'] },
  { slug: 'oil-gas', name: 'Oil & Gas', emoji: '⛽', description: 'Oil and gas industry', group: 'other', subCategories: ['Rig Operator', 'Safety Officer', 'Drilling Engineer', 'HSE Supervisor'] },
  { slug: 'agriculture-farming', name: 'Agriculture & Farming', emoji: '🌾', description: 'Agriculture and farming', group: 'other', subCategories: ['Farm Worker', 'Tractor Driver', 'Irrigation Technician'] },
  { slug: 'animal-care-veterinary', name: 'Animal Care & Veterinary', emoji: '🐾', description: 'Animal care and veterinary', group: 'other', subCategories: ['Animal Caretaker', 'Veterinary Assistant', 'Groomer'] },
  { slug: 'beauty-salon-spa', name: 'Beauty, Salon & Spa', emoji: '💇', description: 'Beauty and wellness', group: 'other', subCategories: ['Hairdresser', 'Beautician', 'Spa Therapist', 'Nail Technician'] },
  { slug: 'event-management-entertainment', name: 'Event Management & Entertainment', emoji: '🎉', description: 'Events and entertainment', group: 'other', subCategories: ['Event Coordinator', 'Photographer', 'DJ / Sound Technician', 'Stage Assistant'] },
  { slug: 'delivery-courier', name: 'Delivery & Courier', emoji: '📦', description: 'Delivery and courier', group: 'other', subCategories: ['Bike Rider', 'Delivery Driver', 'Courier Assistant'] },
  { slug: 'retail-supermarket', name: 'Retail & Supermarket', emoji: '🛒', description: 'Retail and supermarket', group: 'other', subCategories: ['Cashier', 'Sales Assistant', 'Store Supervisor', 'Merchandiser'] },
  { slug: 'domestic-workers', name: 'Domestic Workers', emoji: '🏠', description: 'Domestic and household', group: 'other', subCategories: ['Housemaid', 'Babysitter / Nanny', 'Cook'] },
  { slug: 'fitness-sports', name: 'Fitness & Sports', emoji: '💪', description: 'Fitness and sports', group: 'other', subCategories: ['Gym Trainer', 'Lifeguard', 'Sports Coach'] },
  { slug: 'ai-robotics-tech', name: 'AI & Robotics / Tech Innovation', emoji: '🤖', description: 'AI and tech innovation', group: 'other', subCategories: ['AI Engineer', 'Data Scientist', 'Robotics Technician', 'Machine Learning Developer'] },
  { slug: 'environmental-sustainability', name: 'Environmental & Sustainability', emoji: '🌱', description: 'Environmental roles', group: 'other', subCategories: ['Environmental Officer', 'Waste Management Worker', 'Recycling Plant Operator'] },
  { slug: 'internships-entry-level', name: 'Internships / Entry-Level', emoji: '🎓', description: 'Internships and entry level', group: 'other', subCategories: ['Intern (Admin, IT, HR, etc.)', 'Trainee Engineer', 'Junior Assistant'] },
]

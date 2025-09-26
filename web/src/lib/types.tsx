
// --- Entity Types for Owner, Worker, Shop ---

export type Attendance = {
    date: string; // ISO date string
    hoursWorked: number;
    present: boolean;
};

export type Worker = {
    id: string;
    name: string;
    shopId: string;
    type: 'full-time' | 'part-time' | 'flexible';
    skills: {
        name: string;
        proficiency: number; // 1-10 or similar scale
    }[];
    wageRate: number; // per hour or per day
    workType: string; // e.g. 'cleaning', 'cashier', etc.
    attendance: Attendance[];
};

export type Shop = {
    id: string;
    name: string;
    ownerIds: string[]; // IDs of the owners
    workerIds: string[]; // IDs of workers at this shop
    // Optionally duplicate owner/worker info for denormalization
    ownerNames?: string[];
    workers?: Worker[];
};

export type Owner = {
    id: string;
    name: string;
    shopIds: string[]; // IDs of shops owned
    // Optionally duplicate shop info for denormalization
    shops?: Shop[];
};

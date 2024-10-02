// src/MongoSingleton.ts

import mongoose, { Connection } from 'mongoose';

class MongoDB {
    private static instance: MongoDB;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private dbConnection: Connection | null = null;
    private readonly mongoURI: string = process.env.MONGO_URI || '';

    private constructor() {
        // private constructor ensures Singleton pattern
    }

    public static getInstance(): MongoDB {
        if (!MongoDB.instance) {
            MongoDB.instance = new MongoDB();
        }
        return MongoDB.instance;
    }

    public async connect(): Promise<Connection> {
        if (this.dbConnection) {
            return this.dbConnection; // Return existing connection if already established
        }

        try {
            const db = await mongoose.connect(this.mongoURI);
            this.dbConnection = db.connection;
            console.log('MongoDB connected');
            return this.dbConnection;
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    public getConnection(): Connection | null {
        return this.dbConnection;
    }
}

export default MongoDB;

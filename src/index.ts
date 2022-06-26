import { PromiseUtils, Deferred } from "adv-promise";

export interface ILock {
    wait(): Promise<void>;
}

export class Lock implements ILock {
    
    private deferred: Deferred<void>;
    
    constructor(
        public readonly id: string
    ) {
        this.deferred = PromiseUtils.defer();
    }
    
    resolve() {
        this.deferred.resolve();
    }
    
    wait(): Promise<void> {
        return this.deferred.promise;
    }
}

export class LockRegistry {
    
    private map: Map<string, Lock[]>;
    
    constructor() {
        this.map = new Map();
    }
    
    lock(id: string): ILock {
        if (!this.map.has(id)) {
            this.map.set(id, []);
        }
        const lockList = <Lock[]>this.map.get(id);
        const lock = new Lock(id);
        if (lockList.length == 0) {
            lock.resolve();
        }
        lockList.push(lock);
        return lock;
    }
    
    release(lock: ILock): void {
        if (!(lock instanceof Lock)) {
            return;
        }
        const lockList = this.map.get(lock.id);
        if (lockList == null) {
            return;
        }
        const index = lockList.indexOf(lock);
        if (index == -1) {
            return;
        }
        lockList.splice(index, 1);
        if (index == 0 && lockList.length > 0) {
            lockList[0].resolve();
        }
    }
}

export interface ILockRegistry {
    lock(id: string): ILock;
    release(lock: ILock): void;
}

export class LockManager {
    
    constructor(
        private lockRegistry: ILockRegistry
    ) {
    }
    
    static create() {
        return new LockManager(new LockRegistry());
    }
    
    async withLock<T>(lock: string|string[], func: () => Promise<T>): Promise<T> {
        const locksIds = [...new Set(typeof(lock) == "string" ? [lock] : lock)];
        const locks = locksIds.map(x => this.lockRegistry.lock(x));
        await Promise.all(locks.map(x => x.wait()));
        try {
            return await func();
        }
        finally {
            for (const lock of locks) {
                this.lockRegistry.release(lock);
            }
        }
    }
}

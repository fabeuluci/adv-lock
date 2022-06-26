# Adv-Lock
Lock Manager. Execute only one async call in the same time.

## Usage
```
import { LockManager } from "adv-lock";

const lockManager = LockManager.create();

// do_foo executes first and after do_foo finish do_bar start executing
lockManager.withLock("my-lock-id", () => do_foo());
lockManager.withLock("my-lock-id", () => do_bar());

// you can lock multi ids in the same time
lockManager.withLock(["my-lock-id", "foo", "bar"], () => do_something());
```

# License
MIT
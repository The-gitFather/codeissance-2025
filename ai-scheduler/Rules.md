# AI Scheduler - Model Rules

Your scheduling model follows strict rules to generate feasible shift assignments. These rules ensure fairness, coverage, and respect for employee availability.

---

## 1. Employee Availability

- An employee can only be assigned to a shift if they are **available** for that specific day and shift.
- Days marked as **holidays** automatically have **no assignments**.

---

## 2. Maximum Shifts per Employee

- Each employee cannot exceed their **maximum allowed shifts** across the scheduling period.
- Example: If Alice’s `max_shifts = 3`, she can only be assigned **up to 3 shifts** in total.

---

## 3. Shift Coverage Requirement

- Each shift requires a **minimum number of employees** as specified in the `coverage` array.
- Example: If `coverage = [1, 2]` for two shifts:
  - The first shift needs **1 worker**
  - The second shift needs **2 workers**
- If the required number of workers cannot be met given availability and max shifts, the solver reports **"No feasible schedule found."**

---

## 4. No Evening → Next Morning Rule (Optional)

- An employee **cannot work the last shift of a day (evening)** and the **first shift of the next day (morning)** consecutively.
- Prevents back-to-back late-night → early-morning shifts.

---

## 5. Holidays

- Days listed in the `holidays` array are automatically skipped — **no shifts are assigned** on those days.

---

## 6. Solver Behavior

- The model is **hard-constraint based**, meaning all rules **must be satisfied**.
- If a schedule **cannot satisfy all constraints simultaneously**, the solver returns **"No feasible schedule found."**

---

## Summary

The scheduler ensures **feasible, fair, and compliant schedules** by respecting:

- Employee availability
- Maximum shifts
- Coverage requirements
- Holidays
- Consecutive shift rules

Failures occur **only when the input data cannot satisfy all constraints simultaneously**.

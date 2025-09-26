from ortools.sat.python import cp_model


def schedule(employees, days, shifts_per_day, availability, max_shifts, coverage, holidays=None):
    model = cp_model.CpModel()

    num_employees = len(employees)
    num_days = days
    num_shifts = shifts_per_day

    # Vars: shift[e][d][s] = 1 if employee e works on day d, shift s
    shift = {}
    for e in range(num_employees):
        for d in range(num_days):
            for s in range(num_shifts):
                shift[(e, d, s)] = model.NewBoolVar(f'shift_{employees[e]}{d}{s}')

    # Constraint 1: availability + holidays
    for e in range(num_employees):
        for d in range(num_days):
            for s in range(num_shifts):
                if (employees[e], d, s) not in availability or (holidays and d in holidays):
                    model.Add(shift[(e, d, s)] == 0)

    # Constraint 2: max shifts per employee
    for e in range(num_employees):
        model.Add(sum(shift[(e, d, s)] for d in range(num_days) for s in range(num_shifts)) <= max_shifts[employees[e]])

    # Constraint 3: coverage requirement
    for d in range(num_days):
        if holidays and d in holidays:
            continue
        for s in range(num_shifts):
            model.Add(sum(shift[(e, d, s)] for e in range(num_employees)) >= coverage[s])

    # Optional Constraint 4: no evening → morning
    for e in range(num_employees):
        for d in range(num_days - 1):
            if num_shifts >= 2:
                evening = shift[(e, d, num_shifts - 1)]
                morning = shift[(e, d + 1, 0)]
                model.Add(evening + morning <= 1)

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        result = []
        for d in range(num_days):
            if holidays and d in holidays:
                result.append({"day": d, "schedule": "HOLIDAY"})
                continue
            day_schedule = []
            for s in range(num_shifts):
                workers = [employees[e] for e in range(num_employees) if solver.Value(shift[(e, d, s)]) == 1]
                day_schedule.append({"shift": s, "workers": workers})
            result.append({"day": d, "schedule": day_schedule})
        return result
    else:
        return None

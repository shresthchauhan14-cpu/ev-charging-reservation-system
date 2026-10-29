# Intelligent Waiting-List Reallocation Algorithm

## Multi-Criteria Priority Formulation
**Project:** EV Charging Reservation and Real-Time Availability System  
**Institution:** IILM University, Greater Noida  

---

### Research Motivation

Standard First-Come, First-Served (FCFS) queuing mechanisms in EV charging networks fail during congestion events because they ignore driver urgency. A driver with 80% battery who queued 5 minutes earlier would take priority over an emergency vehicle or a commuter stranded at 10% battery.

VoltReserve introduces a dynamic multi-criteria priority reallocation algorithm:
$$P_i = \alpha U_i + \beta T_i + \gamma R_i$$

Subject to the constraint:
$$\alpha + \beta + \gamma = 0.50 + 0.30 + 0.20 = 1.00$$

---

### Component Definitions

#### 1. Urgency Component ($U_i$) — Weight $\alpha = 0.50$
$$U_i = 1 - \frac{\text{SOC}_i}{100}$$
- $\text{SOC}_i \in [0, 100]$: Driver's reported vehicle State of Charge percentage.
- **Behavior:**
  - $\text{SOC} = 15\% \implies U_i = 1 - 0.15 = 0.85 \implies \alpha U_i = 0.425$
  - $\text{SOC} = 70\% \implies U_i = 1 - 0.70 = 0.30 \implies \alpha U_i = 0.150$
  - Critically depleted vehicles gain an immediate mathematical advantage.

#### 2. Waiting Time Component ($T_i$) — Weight $\beta = 0.30$
$$T_i = \min\left(\frac{t_\text{wait}}{t_\text{max}}, 1.0\right)$$
- $t_\text{wait}$: Elapsed time in minutes since joining the queue ($t_\text{now} - t_\text{queued}$).
- $t_\text{max} = 60\text{ minutes}$: Configured maximum saturation threshold.
- **Behavior:**
  - At $t_\text{wait} = 0\text{ min} \implies T_i = 0.00$
  - At $t_\text{wait} = 45\text{ min} \implies T_i = 45 / 60 = 0.75 \implies \beta T_i = 0.225$
  - At $t_\text{wait} \ge 60\text{ min} \implies T_i = 1.00 \implies \beta T_i = 0.300$
  - Prevents queue starvation for moderately charged vehicles waiting for long periods.

#### 3. Driver Reliability Component ($R_i$) — Weight $\gamma = 0.20$
$$R_i \in [0.0, 1.0]$$
- Derived from the driver's historical booking completion record:
  $$R_i = \frac{N_\text{completed}}{N_\text{completed} + 2 \cdot N_\text{no\_show}}$$
- Drivers who consistently show up on time maintain $R_i \approx 0.95 - 1.00$.
- Drivers with repeated unannounced no-shows are penalized, reducing their reallocation priority.

---

### Deterministic Tie-Breaking
If two candidates achieve identical priority scores ($P_a = P_b$):
- The candidate with the earlier `waiting_since` timestamp is granted the slot.

---

### Verified Numerical Example (from Seed Data)

Consider three drivers queued for dispenser `KP3-DC-02` when a reservation is released:

| Driver | Battery SOC% | Elapsed Wait | Reliability ($R$) | Mathematical Calculation | Final Score ($P_i$) | Rank |
|---|---|---|---|---|---|---|
| **Amit Singh** | 15% | 45 mins | 0.95 | $0.50(0.85) + 0.30(0.75) + 0.20(0.95)$ | **0.8400** | **#1 (Winner)** |
| **Priya Verma** | 35% | 25 mins | 0.90 | $0.50(0.65) + 0.30(0.417) + 0.20(0.90)$ | **0.6300** | **#2** |
| **Sneha Patel** | 60% | 50 mins | 0.85 | $0.50(0.40) + 0.30(0.833) + 0.20(0.85)$ | **0.6200** | **#3** |

**Allocation Decision:**
Amit Singh is awarded the slot because his critically depleted battery (15% SOC) generates an urgency score of $0.85$, yielding a winning priority score of $0.8400$.


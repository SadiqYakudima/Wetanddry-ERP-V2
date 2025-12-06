# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project Title:** Wet & Dry Ltd Enterprise Management System (EMS)  
**Prepared By:** Cybric Technologies  
**Date:** October 30th 2025  
**Version:** 2.0 (Revised)

---

## 1. Executive Summary
The Wet & Dry EMS is a specialized Enterprise Resource Planning (ERP) solution tailored for the ready-mix concrete industry. The system is designed to digitize the end-to-end operations of Wet & Dry Ltd, moving the company from manual paper trails to a centralized digital infrastructure.

The core objective is to create a "Single Source of Truth" for inventory, asset logistics, production formulas (Mixology), and financial accountability.

---

## 2. Strategic Objectives
* **Operational Integrity:** Eliminate human error in material calculations and delivery tracking.
* **Inventory Control:** Centralize stock management with real-time deduction logic for cement, aggregates, and consumables.
* **Asset Maximization:** Monitor truck lifecycles, maintenance schedules, and fuel efficiency to reduce downtime.
* **Financial Accountability:** Link operational inputs (diesel, materials) directly to financial outputs (billing, cost analysis).

---

## 3. User Roles & Governance

| Role | Access Level & Responsibilities |
| :--- | :--- |
| **Super Admin** | Full system governance; configuration of global settings, user management, and audit log access. |
| **Operations Manager** | Oversees logistics, approves "Dump/Divert" workflows, assigns tasks, and monitors truck movement. |
| **Storekeeper** | Controls inventory ingress; manages "Store" locations; validates physical stock against system levels. |
| **Accountant** | Financial oversight; manages invoicing, diesel purchasing records, and expense reporting. |
| **Driver/Operator** | End-user for logistics; logs trip data, fuel receipts, and delivery confirmations. |

---

## 4. Functional Requirements

### 4.1 Truck & Fleet Management Module
**Purpose:** To maintain a digital registry of all heavy machinery and logistics assets, ensuring optimal uptime and asset longevity.

**Key Requirements:**
* **Digital Asset Registry:** Database of all vehicles including plate number, model, purchase date, and capacity.
* **Component Lifecycle Tracking:** Dedicated tracking for high-wear components (Tires, Batteries). The system must record installation dates and flag replacements based on lifespan expectancy.
* **Maintenance Scheduler:** Automated alerts for service intervals (based on date or mileage).
* **Parts Inventory:** Track spare parts by Part Number, Purchase Price, and Quantity.

### 4.2 Advanced Inventory Management
**Purpose:** To manage multi-location stock levels with strict distinction between storage silos to prevent "virtual pooling" of physical assets.

**Key Requirements:**
* **Silo Segregation:** The system must distinctly track **Silo 1** vs. **Silo 2** for cement storage, allowing independent updates and level monitoring.
* **Category Logic:** Items must be categorized as *Assets*, *Consumables*, or *Equipment*.
* **Perishable Management:** Expiry date tracking for chemical admixtures with alerts for nearing expiration.
* **Approval Workflow:**
    1.  Storekeeper initiates "Material Request" or "Stock In".
    2.  Admin/Manager reviews and digitally signs off.
    3.  System updates Master Inventory Record.

### 4.3 Production Automation (Mixology Integration)
**Purpose:** To automate material deduction based on production output, ensuring the digital inventory matches physical consumption.

**Logic Flow:**
1.  **Recipe Configuration:** Admin defines the "Master Recipe" (e.g., C10 Grade = X kg Cement + Y kg Aggregate).
2.  **Production Trigger:** When an operator selects a product (e.g., C10) and Quantity (e.g., 6m³), the system calculates Total Required Materials.
3.  **Auto-Deduction:** The system automatically debits the calculated amounts from the *Inventory Module*.
4.  **Consistency Check:** Any variance between "Recipe Standard" and "Manual Additions" (Augmentation) is flagged for review.

### 4.4 Diesel & Fuel Intelligence
**Purpose:** To track fuel costs against operational output with high granularity.

**Key Requirements:**
* **Route-Based Issuance:** Fuel issuance is calculated based on route distance (via Google Maps integration logic) and site parameters.
* **Consumption Logs:** The system shall require the following data points for every fuel issuance:
    * Date, Site/Customer, Grade, Total Cubic Meters, Total Cement (kg).
    * *Derived Metric:* Efficiency = Diesel Consumed / (Cubic Meters * Distance).
* **Manual Confirmation Logic:** To ensure accountability, the system requires a manual "Dispensed Quantity" entry to confirm the transaction before deducting from the Bulk Fuel Storage.

### 4.5 Production Exceptions (Dump & Divert)
**Purpose:** To handle non-standard delivery scenarios where concrete cannot be delivered to the original customer, ensuring financial and inventory accuracy.

**Key Requirements:**
* **Divert Workflow:**
    * If a delivery is rejected or the site is inaccessible, the Operations Manager can initiate a **"Divert"** action.
    * The system shall allow the reassignment of the current *Delivery Note* to a new *Customer/Site*.
    * Trip logs are updated to reflect the detour distance and additional time.
* **Dump/Waste Workflow:**
    * If the load cannot be saved, the load is marked as **"Dumped"**.
    * The system requires a "Reason Code" (e.g., Traffic Delay, Client Rejection, Equipment Failure).
    * **Financial Impact:** The cost of the wasted material is automatically calculated and logged in a "Waste/Loss" report, separating it from standard "Cost of Goods Sold" (COGS).

---

## 5. Reporting & Analytics

* **KPI Dashboard:**
    * % Schedule Adherence for Maintenance.
    * Stock Accuracy % (System vs. Physical Count).
    * Fuel Efficiency Trends (Liters per Trip).
    * Mix Consistency %.
* **Financial Reports:** Diesel Cost/Day, Material Cost per m³ of Concrete produced.

---

## 6. Technical Architecture & Stack Recommendations

To ensure this system performs at an "Industry Giant" level, the following technical stack is required:

* **Backend Framework:** **Python (Django or FastAPI)** or **Node.js**. These frameworks offer robust handling of calculation-heavy logic (Mixology) and are scalable for future enterprise features.
* **Database:** **PostgreSQL**. Selected for its reliability with complex relational data (Orders vs. Inventory vs. Recipes) and data integrity features.
* **Frontend Interface:** **React.js** or **Vue.js**. A modern, component-based frontend ensures a responsive dashboard for Admins and Managers.
* **Hosting/Infrastructure:** Cloud-native deployment (AWS or Azure) with automated backups to prevent data loss.
* **Security:**
    * Role-Based Access Control (RBAC) enforced at the API level.
    * HTTPS/TLS encryption for all data in transit.
    * Audit trails for *every* stock adjustment (who changed it, when, and why).

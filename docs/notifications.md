Notification Types Matrix
By Role Recipients
Event Trigger	Recipients	Priority	Description
Approval Requests			
New Inventory Item Created	Super Admin, Manager	High	Storekeeper creates item → pending approval
Stock Transaction Submitted	Super Admin, Manager	High	Stock in/out needs approval
Material Request Submitted	Super Admin, Manager	Medium	Material request needs approval
Approval Decisions			
Item Approved/Rejected	Original Requester	High	Feedback on their submission
Stock Transaction Approved/Rejected	Original Requester	High	Feedback on their submission
Material Request Approved/Rejected	Original Requester	High	Feedback on their submission
Inventory Alerts			
Low Stock Alert	Super Admin, Manager, Storekeeper	Critical	Item below minimum threshold
Silo Level Critical	Super Admin, Manager, Storekeeper	Critical	Cement silo below 20%
Fleet & Maintenance			
Maintenance Due (Date)	Super Admin, Manager	High	Scheduled service approaching
Maintenance Due (Mileage)	Super Admin, Manager	High	Mileage threshold reached
Document Expiring	Super Admin, Manager	Medium	Insurance/registration expiring
Spare Parts Low Stock	Super Admin, Manager	Medium	Spare parts below threshold
Exceptions			
New Exception Reported	Super Admin, Manager	High	Dump/divert logged
Exception Resolved	All with view_exceptions	Low	Exception marked resolved
Production			
Production Run Completed	Super Admin, Manager	Low	Batch completed
Material Shortage Warning	Super Admin, Manager, Storekeeper	High	Recipe can't run due to shortage
System/Admin			
New User Created	Super Admin	Low	User account created
User Role Changed	Super Admin	Medium	Role modification
Total: ~18 notification types
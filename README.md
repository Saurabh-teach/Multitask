1. Registration Flow

User fills basic details: First Name, Last Name, Username, Phone Number, Email (optional), Password.
User chooses their role:
"I am starting a new team" → Becomes Owner
"I am joining a team" → Becomes Employee (needs invite code)

System sends 6-digit OTP to the phone number.
After OTP verification:
Owner → New Organization is created automatically + user is assigned role = 'owner'
Employee → Joins existing organization using invite code.


2. Login Flow

User enters Username + Password
If correct → System sends OTP to the registered phone number
User enters OTP → Login successful (2-step verification)

const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());


const data = [
  { id: 1, email: "email1@gmail.com", mobile: "+919988796235", role: "Admin" },
  { id: 2, email: "email2@gmail.com", mobile: "1234567890", role: "User" },
];


app.post("/data", validateEmailMobile, (req, res) => {
  const { email, mobile } = req.body;

  const user = data.find(
    (u) => u.email === email && u.mobile === mobile
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

function validateEmailMobile(req, res, next) {
  let { email, mobile } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const mobileRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }
  mobile = mobile.replace(/[\s-]/g, "");

  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({ message: "Invalid Indian mobile number" });
  }

  if (!mobile.startsWith("+91")) {
    mobile = "+91" + mobile.replace(/^91/, "");
  }

  req.body.email = email.trim();
  req.body.mobile = mobile;

  next();
}


function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(403).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.user = decoded; 
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: Insufficient role" });
    }
    next();
  };
}

app.get("/dashboard", verifyToken, authorizeRoles("Admin"), (req, res) => {
  res.json({ message: "Welcome to My DashBoard!!", user: req.user });
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
// triggering github action
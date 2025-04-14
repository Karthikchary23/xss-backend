import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
const app = express();
app.use(express.json());
dotenv.config();
const PORT = process.env.PORT ;
const MONGO_URI = process.env.MONGO_URI ;
import CustomerCreateAccount from './models/Customercreateaccount.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

app.use(cors({ origin: '*' })); // Vulnerable: Allows all originsapp.use(express.json());
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
app.get('/', (req, res) => {
    res.send('Hello World!');
  });

app.post('/createaccount', async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber, accountnumber } = req.body;
    const checkextistingdata= await CustomerCreateAccount.findOne({ email,  phoneNumber, accountnumber });
    if (checkextistingdata) {
        return res.status(400).json({ message: 'Account with this email or phone number already exists' });
    }
    if (!firstName || !lastName || !email || !password || !phoneNumber || !accountnumber) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAccount = new CustomerCreateAccount({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            accountnumber
        });
        await newAccount.save();
        res.status(201).json({ message: 'Account created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating account', error });
    }
}
);

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const user = await CustomerCreateAccount.findOne({ email: username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log(user);
        const token = jwt.sign({ id: user._id,email:user.email,accountnumber:user.accountnumber,firstName:user.firstName }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(token);
        res.status(200).json({ message: 'Login successful', token, user: { id: user._id, email: user.email,firstName:user.firstName,accountnumber:user.accountnumber } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in', error });
    }
}
);

app.post('/verifytoken', (req, res) => {
  const { token } = req.body; // Safely destructure token

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Log the decoded token for debugging

    res.status(200).json({
      message: 'Token verified successfully',
      user: {
        id: decoded.id,
        email: decoded.email,
        accountnumber: decoded.accountnumber,
        firstName: decoded.firstName,
        
        
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// app.get('/api/profile/:id', async (req, res) => {
//     const { id } = req.params;
//     console.log('Fetching profile for ID:', id); // Log the ID for debugging
//     const user = await CustomerCreateAccount.findById(id);
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.send(`<div>User: ${user.firstName}</div>`); // Reflected XSS
//   });
app.get("/balance",async (req, res) => {
    const { id } = req.query; // Use req.query to get the ID from the query string
    console.log('Fetching balance for ID:', id); // Log the ID for debugging
    try {
        const user = await CustomerCreateAccount.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ balance: user.balance });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ message: 'Error fetching balance', error });
    }
}
);
app.post("/transfer", async (req, res) => {
    const { senderId, receiverAccountNumber, amount } = req.body;
  
    try {
      const sender = await CustomerCreateAccount.findById(senderId);
      if (!sender) return res.status(404).json({ message: "Sender not found" });
  
      if (sender.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
  
      if (sender.balance - amount < 1000) {
        return res
          .status(400)
          .json({ message: "Minimum ₹1000 balance must be maintained" });
      }
  
      const receiver = await CustomerCreateAccount.findOne({ accountnumber: receiverAccountNumber });
      if (!receiver) return res.status(404).json({ message: "Receiver not found" });
  
      // Deduct from sender
      sender.balance -= amount;
      await sender.save();
  
      // Add to receiver
      receiver.balance += amount;
      await receiver.save();
  
      return res.status(200).json({
        message: `Successfully transferred ₹${amount} to ${receiver.firstName}`,
        senderBalance: sender.balance,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
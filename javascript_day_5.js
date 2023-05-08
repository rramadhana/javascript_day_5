const express = require('express');
const app = express();
const port = 3000;

const users = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' },
  { username: 'user3', password: 'pass3' },
];

// Middleware to handle Basic Authentication
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
    const [username, password] = decodedCredentials.split(':');
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).send('Invalid username or password');
    }
  } else {
    res.status(401).send('Authorization header not found');
  }
};

// Function to calculate the price for each term of credit
const calculateTerm = async (book, discountPercentage, taxPercentage, amount, term, additionalPrice) => {
  const price = book.price + additionalPrice;
  const discount = price * (discountPercentage / 100);
  const priceAfterDiscount = price - discount;
  const tax = priceAfterDiscount * (taxPercentage / 100);
  const priceAfterTax = priceAfterDiscount + tax;
  const totalPrice = priceAfterTax * amount;
  const pricePerTerm = totalPrice / term;
  const creditDueEveryMonth = Array.from({ length: term }, (_, i) => {
    const month = i + 1;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + month);
    return { month, dueDate, amount: pricePerTerm.toFixed(2) };
  });
  return creditDueEveryMonth;
};

// Purchase book endpoint
app.post('/api/purchase-book', authenticateUser, async (req, res) => {
  const book = req.body.book;
  const discountPercentage = req.body.discountPercentage;
  const taxPercentage = req.body.taxPercentage;
  const stock = req.body.stock;
  const amount = req.body.amount;
  const term = req.body.term;
  const additionalPrice = req.body.additionalPrice || 0;

  if (stock < amount) {
    res.status(400).send(`Sorry, we only have ${stock} copies of "${book.title}" by ${book.author} in stock.`);
    return;
  }

  let remainingStock = stock;

  const creditDueEveryMonth = await calculateTerm(book, discountPercentage, taxPercentage, amount, term, additionalPrice);

  const totalPrice = creditDueEveryMonth.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2);

  const response = {
    message: `You have purchased ${amount} copy/copies of "${book.title}" by ${book.author}.`,
    totalPrice,
    creditDueEveryMonth,
  };
  if (remainingStock > 0) {
    response.stockMessage = `There are ${remainingStock} copy/copies of "${book.title}" by ${book.author} left in stock.`;
  } else {
    response.stockMessage = `"${book.title}" by ${book.author} is out of stock.`;
  }

  return response;
});

app.post('/api/purchase-book', authenticateUser, async (req, res) => {
    const book = req.body.book;
    const discountPercentage = req.body.discountPercentage;
    const taxPercentage = req.body.taxPercentage;
    const amount = req.body.amount;
    const term = req.body.term;
    const additionalPrice = req.body.additionalPrice || 0;
  
    try {
      const result = await calculateTermPrice(book, amount, discountPercentage, taxPercentage, term, additionalPrice);
      res.send(result);
    } catch (error) {
      res.status(400).send(error.message);
    }
  });
  
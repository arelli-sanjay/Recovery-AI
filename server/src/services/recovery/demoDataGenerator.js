const names = [
  "Rahul Sharma",
  "Priya Mehta",
  "Arjun Rao",
  "Ananya Singh",
  "Vikram Patel",
  "Sneha Reddy",
  "Karan Malhotra",
  "Neha Kapoor",
];

const failureReasons = [
  "Payment declined",
  "Insufficient funds",
  "Temporary gateway failure",
  "Bank timeout",
  "Authentication failed",
];

const paymentMethods = [
  "card",
  "upi",
  "netbanking",
  "wallet",
];

const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

const randomAmount = () => {
  const amounts = [
    499,
    799,
    999,
    1499,
    1999,
    2499,
    3499,
    4999,
    7999,
  ];

  return randomItem(amounts);
};

const generateDemoTransactions = (count = 100) => {
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const random = Math.random();

    let status;

    if (random < 0.62) {
      status = "success";
    } else if (random < 0.80) {
      status = "failed";
    } else if (random < 0.92) {
      status = "pending";
    } else {
      status = "abandoned";
    }

    transactions.push({
      customerName: randomItem(names),
      customerEmail: `customer${i + 1}@demo.com`,
      amount: randomAmount(),
      status,
      failureReason:
        status === "failed"
          ? randomItem(failureReasons)
          : null,
      paymentMethod: randomItem(paymentMethods),
    });
  }

  return transactions;
};

export default generateDemoTransactions;
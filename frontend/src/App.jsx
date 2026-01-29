import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://192.168.0.9:8000:";

export default function App() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);

  const loadExpenses = async () => {
    try {
      const res = await axios.get(`${API}/expenses`);
      setExpenses(res.data);
    } catch (err) {
      console.error("API not reachable", err);
    }
  };

  const addExpense = async () => {
    if (!title || !amount) return;

    try {
      await axios.post(`${API}/expenses`, {
        title,
        amount: Number(amount),
        category,
      });

      setTitle("");
      setAmount("");
      setCategory("Food");
      loadExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteExpense = async (id) => {
    await axios.delete(`${API}/expenses/${id}`);
    loadExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    loadExpenses();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8">

        <h1 className="text-4xl font-bold text-center text-indigo-700">
          Expense Tracker
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Track your daily spending like a pro
        </p>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-indigo-600">₹ {total}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-gray-500">Entries</p>
            <p className="text-2xl font-bold text-purple-600">
              {expenses.length}
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            className="border rounded-lg p-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            className="border rounded-lg p-2"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="border rounded-lg p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
          </select>
          <button
            onClick={addExpense}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
          >
            + Add
          </button>
        </div>

        {/* LIST */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Expense History</h2>
          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2"
            >
              <div>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-gray-500">{e.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-red-500">₹ {e.amount}</p>
                <button
                  onClick={() => deleteExpense(e.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

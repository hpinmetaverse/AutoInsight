import axios from "axios";

export const predictSentiment = async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:8000/predict",
      { text: req.body.text }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ML service request failed" });
  }
};

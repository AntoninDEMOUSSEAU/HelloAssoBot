const express = require("express");
const app = express();
app.use(express.json());

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

var totalTicketsSold = 0;

app.get("/", (req, res) => res.send("HelloAsso → Slack webhook actif ✅"));

app.post("/webhook/helloasso", async (req, res) => {
  try {
    const payload = req.body;
    const eventType = payload.eventType || payload.type || "";

    if (!["Order", "Payment"].some((t) => eventType.includes(t))) {
      return res.status(200).json({ ignored: true, eventType });
    }

    const order = payload.data || payload;

    const buyerFirstName = (order.payer && order.payer.firstName) || "Inconnu";
    const buyerLastName  = (order.payer && order.payer.lastName)  || "";
    const buyerEmail     = (order.payer && order.payer.email)     || "";

    const items = order.items || [];
    var ticketsInOrder = 0;
    if (items.length === 0) {
      ticketsInOrder = 1;
    } else {
      for (var i = 0; i < items.length; i++) {
        ticketsInOrder += items[i].quantity || 1;
      }
    }

    const amountCents = (order.amount && order.amount.total) || order.totalAmount || 0;
    const amountEuros = (amountCents / 100).toFixed(2);

    totalTicketsSold += ticketsInOrder;

    const eventName = (items[0] && items[0].name) || order.formName || "Événement";

    const slackMessage = {
      text: "🎟️ Nouvelle vente sur HelloAsso !",
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🎟️ Nouvelle vente de billet !", emoji: true },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Acheteur :*\n" + buyerFirstName + " " + buyerLastName },
            { type: "mrkdwn", text: "*Email :*\n" + (buyerEmail || "_Non communiqué_") },
          ],
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Événement :*\n" + eventName },
            { type: "mrkdwn", text: "*Montant payé :*\n" + amountEuros + " €" },
          ],
        },
        { type: "divider" },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Billets dans cette commande :*\n*" + ticketsInOrder + "* billet(s)" },
            { type: "mrkdwn", text: "*Total billets vendus :*\n*" + totalTicketsSold + "* au total 🎉" },
          ],
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: "Reçu le " + new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) },
          ],
        },
      ],
    };

    const slackRes = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!slackRes.ok) {
      const errText = await slackRes.text();
      console.error("Erreur Slack :", errText);
      return res.status(500).json({ error: "Erreur envoi Slack" });
    }

    console.log("✅ Vente notifiée : " + ticketsInOrder + " billet(s) — Total : " + totalTicketsSold);
    res.status(200).json({ success: true, ticketsInOrder: ticketsInOrder, totalTicketsSold: totalTicketsSold });

  } catch (err) {
    console.error("Erreur webhook :", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Serveur démarré sur le port " + PORT);
  if (!SLACK_WEBHOOK_URL) {
    console.warn("⚠️  SLACK_WEBHOOK_URL non définie !");
  }
});

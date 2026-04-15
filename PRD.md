# CHILIZBURN.INFO — Product Requirements Document (PRD)

## 1. Product Overview

### Product Name
ChilizBurn.info

### Tagline
Real-time transparency for CHZ burns — data meets fan energy.

### Vision
Become the default transparency layer for Chiliz ecosystem economics, making token burns understandable, verifiable, and engaging for both crypto users and sports fans.

### Product Type
Hybrid:
- Analytics dashboard (credibility, data)
- Community/hype product (engagement, virality)

## 2. Objectives

### Primary Goals
- Track and display all CHZ burns accurately
- Build trust via verifiable on-chain data
- Simplify complex tokenomics for users

### Secondary Goals
- Increase engagement within Chiliz/Socios ecosystem
- Become a shareable dashboard (Twitter, Telegram)
- Lay foundation for future analytics products

## 3. Target Users

### 1. Crypto Users
- Want transparency
- Care about supply, tokenomics

### 2. Socios Fans
- Not deeply technical
- Want simple visuals + impact

### 3. Traders / Analysts
- Want historical + structured data

## 4. Core Features

### 4.1 Dashboard (Homepage)
KPIs:
- Total CHZ Burned (All-time)
- Latest Burn Amount
- Monthly Burn Total
- % of Supply Burned

### 4.2 Charts
1. Cumulative Burn Chart
- Line graph
- Total CHZ burned over time

2. Monthly Burn Chart
- Bar graph
- Burn per month

3. Burn vs Price Chart
- Dual-axis
- CHZ burn vs CHZ price

### 4.3 Burn Feed (Core Table)
Fields:
- Date
- Amount (CHZ)
- USD Value
- Transaction Hash
- Burn Type

Features:
- Sortable
- Clickable TX links
- Pagination

### 4.4 Transaction Detail Page
Displays:
- TX hash
- Block number
- Timestamp
- From / To
- Amount burned
- Gas fee

### 4.5 Methodology Page
Explains:
- What is a burn
- How burns are detected
- Data sources
- Verification process

## 5. Data and Backend Requirements

### 5.1 Data Sources
- Chiliz Chain Explorer (Blockscout)
- RPC endpoints
- CoinGecko API (price data)

### 5.2 Burn Detection Logic
Criteria:
- Transfer to zero address

Process:
1. Fetch transactions
2. Filter burns
3. Decode amount
4. Store in database

### 5.3 Database Schema
Table: burns
- tx_hash (PK)
- timestamp
- amount_raw
- amount_chz
- usd_value
- burn_type

### 5.4 API Endpoints
- GET /burns
- GET /burns/latest
- GET /stats
- GET /charts

## 6. Frontend Requirements

### Tech Stack
- Next.js
- Tailwind CSS
- Chart.js / Recharts

### UI Principles
- Clean
- Dark theme
- Fast loading
- Mobile responsive

## 7. UX Strategy

### Design Goals
- Big numbers first
- Visual storytelling
- Minimal friction

### Key Elements
- KPI cards
- Interactive charts
- Simple navigation

## 8. MVP Scope
Must have:
- Burn tracking
- Dashboard
- Basic charts
- Burn table

## 9. Future Features (V2)

### Advanced Analytics
- Burn impact score
- Supply projections

### Community Features
- Telegram alerts
- Twitter auto updates

### Ecosystem Insights
- Fan token -> burn correlation
- Activity tracking

## 10. Notifications System
- Burn detected -> trigger alert
- Channels:
  - Telegram bot
  - Twitter bot

## 11. Success Metrics

### Product Metrics
- Daily active users
- Page views
- Retention rate

### Data Metrics
- Accuracy of burn tracking
- Time to detect new burn

## 12. Risks and Considerations

### Technical Risks
- API rate limits
- Explorer downtime

### Data Risks
- Misidentifying burns
- Incomplete data

### UX Risks
- Over-complication
- Slow performance

## 13. Architecture
Chiliz Chain -> Data Fetcher -> Database -> API -> Frontend

## Final Note
ChilizBurn.info is not just a tracker; it is a transparency engine plus engagement layer for the Chiliz ecosystem.
Success depends on: Accuracy, Simplicity, Speed, Trust.

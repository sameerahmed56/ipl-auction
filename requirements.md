IPL Auction Game: Project Plan & Requirements

1. Project Overview

Concept

A 2-10 player multiplayer real-time game simulating the Indian Premier League (IPL) auction. The game is designed to be a fun, strategic, and "live" experience for a group of friends, playable on any device.

Objective

Players take on the role of "Team Owners." They compete to build the best 11-player cricket team by bidding on players from a shared, pre-defined pool. Success is determined by strategic bidding, budget management, and fulfilling the final team's composition requirements.

Platform

A web-based application, fully responsive for desktop, tablet, and mobile devices.

2. User Roles & Permissions

There are three distinct roles in this game ecosystem:

Admin (Super User):

Function: Manages the global database of all available cricketers.

Permissions: Can add, edit, and delete players from the "Master Player List." This role is for game setup and maintenance, not for regular play.

Host (Game Creator):

Function: Creates a single game session, sets the rules, and manages the game's flow.

Permissions:

Creates a new game lobby and receives a unique "Game Code."

Builds the auction by selecting players from the Master List.

Organizes players into "Slots" to control the auction order.

Sets the game rules (e.g., starting budget, bid timer).

Controls the live auction with "Start," "Pause," and "Resume" commands.

Player (Team Owner):

Function: Participates in the game to compete.

Permissions:

Joins a game using a Game Code.

Bids on players during the live auction.

Manages their team's budget and roster.

Selects their "Final 11" players after the auction.

3. Core Features

Admin Features

Master Player Database: A simple interface (a "script" or basic page) for the Admin to add, edit, and delete players. Each player record will include:

Player Name

Role (Batsman, Bowler, Wicket-Keeper, All-Rounder)

Points (a skill value, e.g., out of 100)

Base Price (the starting bid)

Host Features (Game Setup & Management)

Game Creation: Generate a unique, shareable "Game Code" for a new game lobby.

Auction Curation: The Host is presented with the Master Player List and can select which players will be included in this specific game.

Slot Creation: The Host organizes the selected players into "Slots" (e.g., "Set 1: Marquee Batsmen," "Set 2: Fast Bowlers"). This defines the order in which players are auctioned.

Rule Configuration: The Host sets the key parameters for the game:

Starting Budget: The amount of "money" each team begins with.

Bid Timer: The time (e.g., 30 seconds) that must pass without a new bid for a player to be sold.

Player Features (Gameplay)

Join Game: A simple screen to enter a Game Code and a Team Name to join a lobby.

Bidding Interface: A clear, real-time screen that shows:

The player currently being auctioned (name, role, points).

The current highest bid.

The team that holds the current highest bid.

A single "Bid" button showing the next valid amount.

Roster Management: A personal dashboard to see all players their team has successfully bought, their sold prices, and the team's remaining budget.

Final Team Selection: A post-auction screen where the player selects their "Final 11" from their full roster to be scored.

4. Game Flow (The User Journey)

Phase 1: Setup (Host):

The Host creates a new game.

They are taken to a setup screen to curate the player list and create the auction slots.

Once finalized, the game lobby is "Open," and a Game Code is shown.

Phase 2: Lobby (All Players):

Players use the Game Code to join the lobby.

All participants can see a list of other teams who have joined, waiting for the Host to begin.

Phase 3: Pre-Auction Review (Host-Controlled):

The Host clicks "Start Review."

The game transitions to a new screen for all players.

This screen displays a read-only list of all players and the slots they are in, allowing teams to plan their strategy.

This phase lasts indefinitely until the Host clicks "Start Auction."

Phase 4: The Live Auction (Host-Controlled):

The Host clicks "Start Auction."

The game automatically puts the first player (from Slot 1) up for auction. The timer begins.

Players can now bid. The interface updates in real-time for everyone.

The Host has "Pause" and "Resume" controls over the auction at all times.

This continues until every player has been put up for auction.

Phase 5: Post-Auction (Team Selection):

After the last player is auctioned, the "Final Team Selection" screen appears.

Each player reviews their full roster (e.g., 18 players) and must select their best 11 players.

Phase 6: Results:

A final leaderboard is displayed, ranking all teams based on their score.

5. Key Rules & Mechanics

Bidding System

Bidding is not free-form. It uses Fixed Bid Increments.

The "Bid" button will always show the next valid bid amount (e.g., "Bid 2.2 Cr").

The increment value automatically increases as the bid amount gets higher (e.g., +0.2 Cr for low bids, +1.0 Cr for high bids).

Sold/Unsold Logic

A player is put on the block with a base price and a timer.

Placing a bid resets the timer (e.g., back to 10 seconds).

If the timer (as set by the Host) runs out, the player is SOLD to the last team that bid.

If the timer runs out and no bids were placed, the player is UNSOLD.

Budget Management

Players cannot bid higher than their remaining budget.

The system will automatically prevent a bid (e.g., disable the bid button) if the team does not have sufficient funds for the next bid increment.

6. Win/Loss Conditions

Winning

The winner is the team with the highest Final Score.

The Final Score is calculated as the sum of "Points" (the skill value) from the 11 players selected in their "Final 11" squad.

Losing (Disqualification)

A team automatically LOSES if they fail to build a valid "Final 11" team.

A valid team must consist of:

At least 1 Wicket-Keeper

At least 5 Batsmen

At least 5 Bowlers

Note: All-Rounders can be used to satisfy either a Batsman or a Bowler requirement.

If a team cannot meet this composition from their roster (e.t., they only bought 4 bowlers), they are disqualified from the final scoring and cannot win, regardless of points.



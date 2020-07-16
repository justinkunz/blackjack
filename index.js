const inq = require("inquirer");
const $ = require("arrayfriend"); // uhhhh yeah, im repping my own library

/**
 * Generates 52 card deck
 */
const generateDeck = () => {
  const suites = ["♥", "♠", "♣", "♦"];
  const royal = ["Jack", "King", "Queen"];

  return $(...suites)
    .map((suite) => {
      const suiteCards = $.withLength(8).map((n, i) => ({
        name: `${suite}${i + 2}`,
        suite,
        value: i + 2,
      }));
      suiteCards.concat(
        royal.map((c) => ({
          name: `${suite}${c}`,
          suite,
          value: 10,
        }))
      );
      suiteCards.push({
        name: `${suite}Ace`,
        suite,
        value: 1,
      });
      return suiteCards;
    })
    .flat();
};

/**
 * Prints winner of game
 *
 * @param {Boolean} playerWon Player is winner
 * @param {Boolean} tied Optional, if tied
 */
const printWinner = (playerWon, tied = false) => {
  console.log(`
    ===============  
    ${playerWon ? "You Won!" : tied ? "Tied!" : "House Won."}
    ===============  
    `);
};

/**
 * Get all possible scores from hand
 *
 * @param {Card[]} hand Hand to generate score possibilities for
 */
const possibleScores = (hand) => {
  const vals = $(...hand.map((card) => card.value));
  const count = vals.sum();

  // Aces can be 1 or 11, generate with all possibilities
  const aceCount = vals.countOf(1);
  return [count].concat($.withLength(aceCount).map((j, n) => count + (n + 1) * 10));
};

/**
 * Determine Winner of game
 *
 * @param {Card[]} dealer Dealers hand
 * @param {Card[]} player Players hand
 */
const decideGame = (dealer, player) => {
  const [dealerSum, playerSum] = [possibleScores(dealer), possibleScores(player)];
  const [dealerScore, playerScore] = [
    Math.max(...dealerSum.filter((c) => c <= 21)),
    Math.max(...playerSum.filter((c) => c <= 21)),
  ];

  console.log(`
  DEALERS SCORE: ${dealerScore < 0 ? "Bust" : dealerScore}
  YOUR SCORE: ${playerScore}
  `);
  if (playerScore > dealerScore) {
    printWinner(true);
  } else if (dealerScore > playerScore) {
    printWinner(false);
  } else {
    printWinner(false, true);
  }

  endGame();
};

/**
 * Draw dealers hand after player chooses to stay
 *
 * @param {Card[]} deck Card deck being used
 * @param {Card[]} dealer Dealers hand
 * @param {Card[]} player Players hand
 */
const dealerDraw = (deck, dealer, player) => {
  const [dealerSum, playerSum] = [possibleScores(dealer), possibleScores(player)];

  const dealerStay =
    dealerSum.every((score) => score >= 17) ||
    dealerSum.some((score) => playerSum.every((pscore) => score > pscore));

  if (!dealerStay) {
    setTimeout(() => {
      const nextCard = deck.pop();
      dealer.push(nextCard);
      console.log(nextCard.name);

      dealerDraw(deck, dealer, player);
    }, 1000);
  } else {
    decideGame(dealer, player);
  }
};

/**
 * Draw Next card, get decision from player
 *
 * @param {Card[]} deck Card deck being used
 * @param {Card[]} dealer Dealers hand
 * @param {Card[]} player Players hand
 */
const round = async (deck, dealer, player) => {
  printHands(dealer, player);

  const isStillActive = possibleScores(player).some((score) => score <= 21);

  if (!isStillActive) {
    printWinner(false);
    return endGame();
  }
  const { hit } = await inq.prompt([
    {
      message: "Hit or Stay?",
      type: "list",
      name: "hit",
      choices: [
        { name: "Hit", value: true },
        { name: "Stay", value: false },
      ],
    },
  ]);

  if (hit) {
    player.push(deck.pop());
    return round(deck, dealer, player);
  } else {
    console.clear();
    console.log(`Dealers Hand:\n${dealer.map((card) => card.name).join("\n")}`);
    dealerDraw(deck, dealer, player);
  }
};

/**
 * Print current score for player & dealer
 *
 * @param {Card[]} dealer Dealers hand
 * @param {Card[]} player Players hand
 */
const printHands = (dealer, player) => {
  console.clear();
  console.log(`
    ==============
    DEALERS HAND
    ==============
    ${dealer[0].name}
    ???

    ==============
    YOUR HAND
    ==============
    ${player.map((card) => card.name).join("\n    ")}

    TOTAL: ${possibleScores(player)
      .filter((score) => score <= 21)
      .join(" or ")}
    `);
};

/**
 * Shuffles deck, begins Blackjack game
 */
const startGame = () => {
  const deck = generateDeck().shuffle();
  const dealersHand = [deck.pop(), deck.pop()];
  const playersHand = [deck.pop(), deck.pop()];

  round(deck, dealersHand, playersHand);
};

/**
 * After game result, prompt user for new game
 */
const endGame = async () => {
  const { playAgain } = await inq.prompt([
    {
      message: "Play again?",
      type: "list",
      name: "playAgain",
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
    },
  ]);

  if (playAgain) startGame();
};

startGame();

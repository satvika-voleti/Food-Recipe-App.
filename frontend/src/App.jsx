import { useState } from "react";
import "./App.css";

const initialRecipes = [
  {
    id: 1,
    name: "Paneer Butter Masala",
    category: "Indian",
    time: "30 min",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700",
    ingredients: ["Paneer", "Tomatoes", "Butter", "Cream", "Onion"],
    steps: [
      "Heat butter in a pan.",
      "Add chopped onions and tomatoes.",
      "Add spices and cook well.",
      "Add paneer and cream.",
      "Cook for five minutes and serve."
    ]
  },
  {
    id: 2,
    name: "Vegetable Fried Rice",
    category: "Chinese",
    time: "20 min",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700",
    ingredients: ["Rice", "Carrot", "Beans", "Capsicum", "Soy Sauce"],
    steps: [
      "Cook the rice.",
      "Heat oil in a pan.",
      "Add chopped vegetables.",
      "Add rice and soy sauce.",
      "Mix well and serve hot."
    ]
  },
  {
    id: 3,
    name: "Masala Dosa",
    category: "South Indian",
    time: "25 min",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700",
    ingredients: ["Dosa Batter", "Potatoes", "Onion", "Green Chilli"],
    steps: [
      "Boil potatoes and prepare masala.",
      "Heat a dosa pan.",
      "Spread the dosa batter.",
      "Add potato masala.",
      "Fold the dosa and serve."
    ]
  },
  {
    id: 4,
    name: "Chocolate Cake",
    category: "Dessert",
    time: "45 min",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700",
    ingredients: ["Flour", "Cocoa Powder", "Sugar", "Eggs", "Butter", "Milk"],
    steps: [
      "Mix flour and cocoa powder.",
      "Add sugar and eggs.",
      "Add butter and milk.",
      "Mix the batter.",
      "Bake until cooked through.",
      "Cool and serve."
    ]
  }
];

function App() {
  const [page, setPage] = useState("home");
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState([]);
  const [message, setMessage] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    `${recipe.name} ${recipe.category} ${recipe.ingredients.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function toggleSave(id) {
    setSaved((old) =>
      old.includes(id) ? old.filter((item) => item !== id) : [...old, id]
    );
  }

  function addRecipe(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const recipe = {
      id: Date.now(),
      name: data.get("name").trim(),
      category: data.get("category").trim(),
      time: data.get("time").trim() || "Not specified",
      image: data.get("image").trim() ||
        "https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
      ingredients: data.get("ingredients").split(",").map(x => x.trim()).filter(Boolean),
      steps: data.get("steps").split("\n").map(x => x.trim()).filter(Boolean)
    };

    if (!recipe.name || !recipe.category ||
        !recipe.ingredients.length || !recipe.steps.length) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setRecipes((old) => [recipe, ...old]);
    setSearch("");
    setMessage("Recipe added successfully!");
    event.currentTarget.reset();
    setPage("recipes");
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="brand" onClick={() => setPage("home")}>
          🍴 RecipeHub
        </button>
        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("recipes")}>Recipes</button>
          <button onClick={() => { setMessage(""); setPage("add"); }}>Add Recipe</button>
          <button onClick={() => { setMessage(""); setPage("profile"); }}>Profile</button>
        </nav>
      </header>

      {page === "home" && (
        <>
          <section className="hero">
            <p className="eyebrow">YOUR DAILY DOSE OF DELICIOUS</p>
            <h1>Cook something <span>amazing.</span></h1>
            <p>Discover simple, tasty recipes for every day.</p>
            <div className="hero-search">
              <span>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes or ingredients..."
              />
              <button onClick={() => setPage("recipes")}>Search</button>
            </div>
            <p className="hero-tags">🍲 Easy recipes　 🥗 Fresh ingredients　 ❤️ Made with love</p>
          </section>

          <main className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">HANDPICKED FOR YOU</p>
                <h2>Popular Recipes</h2>
              </div>
              <button className="text-button" onClick={() => setPage("recipes")}>
                View all →
              </button>
            </div>
            <RecipeGrid recipes={filteredRecipes.slice(0, 4)} onOpen={(r) => {
              setSelectedRecipe(r); setPage("details");
            }} saved={saved} onSave={toggleSave} />
          </main>
        </>
      )}

      {page === "recipes" && (
        <main className="container page-content">
          <p className="eyebrow">EXPLORE YOUR NEXT MEAL</p>
          <h1>All Recipes</h1>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, cuisine, ingredient..."
          />
          <RecipeGrid recipes={filteredRecipes} onOpen={(r) => {
            setSelectedRecipe(r); setPage("details");
          }} saved={saved} onSave={toggleSave} />
          {filteredRecipes.length === 0 && <p>No recipes found.</p>}
        </main>
      )}

      {page === "details" && selectedRecipe && (
        <main className="container page-content">
          <button className="back-button" onClick={() => setPage("recipes")}>
            ← Back to recipes
          </button>
          <div className="detail-layout">
            <img className="detail-image" src={selectedRecipe.image} alt={selectedRecipe.name} />
            <div className="detail-content">
              <p className="eyebrow">{selectedRecipe.category}</p>
              <h1>{selectedRecipe.name}</h1>
              <p>⏱️ {selectedRecipe.time}</p>
              <button className="primary-button" onClick={() => toggleSave(selectedRecipe.id)}>
                {saved.includes(selectedRecipe.id) ? "♥ Saved" : "♡ Save Recipe"}
              </button>
              <h2>Ingredients</h2>
              <ul className="ingredient-list">
                {selectedRecipe.ingredients.map((item, i) => <li key={i}>✓ {item}</li>)}
              </ul>
              <h2>Preparation Steps</h2>
              <ol className="steps-list">
                {selectedRecipe.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          </div>
        </main>
      )}

      {page === "add" && (
        <main className="form-container page-content">
          <p className="eyebrow">SHARE YOUR CREATION</p>
          <h1>Add a New Recipe</h1>
          <form onSubmit={addRecipe}>
            <label>Recipe Name *
              <input name="name" placeholder="e.g. Vegetable Pulao" required />
            </label>
            <label>Category *
              <input name="category" placeholder="e.g. Indian" required />
            </label>
            <label>Cooking Time
              <input name="time" placeholder="e.g. 30 min" />
            </label>
            <label>Image URL (optional)
              <input name="image" placeholder="Paste image URL" />
            </label>
            <label>Ingredients *
              <textarea name="ingredients" placeholder="Rice, onion, carrot" required />
              <small>Separate ingredients with commas.</small>
            </label>
            <label>Preparation Steps *
              <textarea name="steps" placeholder={"Wash ingredients\nCook the food\nServe hot"} required />
              <small>Write each step on a new line.</small>
            </label>
            <button className="primary-button" type="submit">+ Add Recipe</button>
          </form>
        </main>
      )}

      {page === "profile" && (
        <main className="profile-container page-content">
          <div className="profile-icon">👩‍🍳</div>
          <p className="eyebrow">YOUR PERSONAL SPACE</p>
          <h1>My Profile</h1>
          
<form
  className="username-form"
  onSubmit={async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save username");
      }

      setMessage(data.message);
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }}
>
  <label htmlFor="username">Username</label>

  <input
    id="username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    placeholder="Enter your username"
    required
  />

  <button className="primary-button" type="submit">
    Save Username
  </button>
</form>
          {message && <p className="success-message">{message}</p>}
          <div className="profile-stats">
            <div><strong>{recipes.length}</strong><span>Recipes</span></div>
            <div><strong>{saved.length}</strong><span>Saved Recipes</span></div>
          </div>
          <h2>My Saved Recipes</h2>
          {recipes.filter((r) => saved.includes(r.id)).map((r) => (
            <button className="saved-item" key={r.id} onClick={() => {
              setSelectedRecipe(r); setPage("details");
            }}>{r.name} →</button>
          ))}
          {saved.length === 0 && <p className="muted">Your saved recipes will appear here.</p>}
        </main>
      )}

      <footer className="footer">
        <h2>🍴 RecipeHub</h2>
        <p>Good food. Good mood. Happy cooking!</p>
        <small>Food Recipe App · College Project</small>
      </footer>
    </div>
  );
}

function RecipeGrid({ recipes, onOpen, saved, onSave }) {
  if (recipes.length === 0) return <p className="empty-state">No recipes found.</p>;

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <article className="recipe-card" key={recipe.id}>
          <div className="image-wrapper">
            <img src={recipe.image} alt={recipe.name} />
            <span className="category-badge">{recipe.category}</span>
            <button className="heart-button" onClick={() => onSave(recipe.id)}>
              {saved.includes(recipe.id) ? "♥" : "♡"}
            </button>
          </div>
          <div className="card-content">
            <p className="recipe-time">⏱️ {recipe.time}</p>
            <h3>{recipe.name}</h3>
            <button className="view-button" onClick={() => onOpen(recipe)}>
              View Recipe →
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default App;

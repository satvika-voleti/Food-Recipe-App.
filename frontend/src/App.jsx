import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5001";

const initialRecipes = [
  {
    id: "sample-1",
    name: "Paneer Butter Masala",
    category: "Indian",
    time: "30 min",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700",
    ingredients: ["Paneer", "Tomatoes", "Butter", "Cream", "Onion"],
    steps: ["Heat butter in a pan.", "Add chopped onions and tomatoes.", "Add spices and cook well.", "Add paneer and cream.", "Cook for five minutes and serve."]
  },
  {
    id: "sample-2",
    name: "Vegetable Fried Rice",
    category: "Chinese",
    time: "20 min",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700",
    ingredients: ["Rice", "Carrot", "Beans", "Capsicum", "Soy Sauce"],
    steps: ["Cook the rice.", "Heat oil in a pan.", "Add chopped vegetables.", "Add rice and soy sauce.", "Mix well and serve hot."]
  },
  {
    id: "sample-3",
    name: "Masala Dosa",
    category: "South Indian",
    time: "25 min",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700",
    ingredients: ["Dosa Batter", "Potatoes", "Onion", "Green Chilli"],
    steps: ["Boil potatoes and prepare masala.", "Heat a dosa pan.", "Spread the dosa batter.", "Add potato masala.", "Fold the dosa and serve."]
  },
  {
    id: "sample-4",
    name: "Chocolate Cake",
    category: "Dessert",
    time: "45 min",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700",
    ingredients: ["Flour", "Cocoa Powder", "Sugar", "Eggs", "Butter", "Milk"],
    steps: ["Mix flour and cocoa powder.", "Add sugar and eggs.", "Add butter and milk.", "Mix the batter.", "Bake until cooked through.", "Cool and serve."]
  }
];

function App() {
  const [page, setPage] = useState("login");
  const [loginType, setLoginType] = useState("user");
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [saved, setSaved] = useState([]);
  const [message, setMessage] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    `${recipe.name} ${recipe.category} ${(recipe.ingredients || []).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function loadRecipes() {
    try {
      const response = await fetch(`${API}/api/recipes`);
      if (!response.ok) throw new Error("Could not load recipes");
      const data = await response.json();
      const databaseRecipes = data.map((recipe) => ({ ...recipe, id: recipe._id }));
      setRecipes([...databaseRecipes, ...initialRecipes]);
    } catch (error) {
      setMessage("Could not load saved recipes. Showing sample recipes.");
    }
  }

 useEffect(() => {
  const savedUser = localStorage.getItem("recipehubUser");

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      setName(user.name || "");
      setPhone(user.phone || "");
      setPage("home");
    } catch {
      localStorage.removeItem("recipehubUser");
    }
  }

  loadRecipes();
}, []);

  function toggleSave(id) {
    setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  }

  async function handleUserLogin(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      setName(data.user.name);
      localStorage.setItem("recipehubUser", JSON.stringify(data.user));
      setIsAdmin(false);
      await loadRecipes();
      setMessage("");
      setPage("home");
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Admin login failed");
      setAdminToken(data.token);
      setIsAdmin(true);
      setName("Admin");
      await loadRecipes();
      setMessage("");
      setPage("home");
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }

  async function addRecipe(event) {
    event.preventDefault();
    if (!isAdmin || !adminToken) {
      setMessage("Only the admin can add recipes.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const recipe = {
      name: data.get("name").trim(),
      category: data.get("category").trim(),
      time: data.get("time").trim() || "Not specified",
      image: data.get("image").trim() || "https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
      ingredients: data.get("ingredients").split(",").map((x) => x.trim()).filter(Boolean),
      steps: data.get("steps").split("\n").map((x) => x.trim()).filter(Boolean)
    };
    if (!recipe.name || !recipe.category || !recipe.ingredients.length || !recipe.steps.length) {
      setMessage("Please fill in all required fields.");
      return;
    }
    try {
      const response = await fetch(`${API}/api/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(recipe)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add recipe");
      const savedRecipe = { ...result.recipe, id: result.recipe._id };
      setRecipes((old) => [savedRecipe, ...old]);
      setSearch("");
      setMessage("Recipe added successfully and saved to MongoDB!");
      form.reset();
      setPage("recipes");
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }

  function logout() {
    setIsAdmin(false);
    setAdminToken("");
    setName("");
    setPhone("");
    setAdminUsername("");
    setAdminPassword("");
    setMessage("");
    setPage("login");
    localStorage.removeItem("recipehubUser");
  }

  if (page === "login") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff5f3", padding: "20px" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "18px", width: "100%", maxWidth: "440px", textAlign: "center", boxShadow: "0 5px 25px rgba(0,0,0,0.08)" }}>
          <h1 style={{ color: "#e23744", fontSize: "36px", marginBottom: "8px" }}>RecipeHub</h1>
          <p style={{ color: "#666", marginTop: 0 }}>Discover delicious food and recipes!</p>
          <h2>Welcome!</h2>
          <div style={{ display: "flex", gap: "8px", margin: "20px 0" }}>
            <button type="button" onClick={() => { setLoginType("user"); setMessage(""); }} style={tabStyle(loginType === "user")}>User Login</button>
            <button type="button" onClick={() => { setLoginType("admin"); setMessage(""); }} style={tabStyle(loginType === "admin")}>Admin Login</button>
          </div>
          {loginType === "user" ? (
            <>
              <p>Login with your name and phone number</p>
              <form onSubmit={handleUserLogin}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required style={loginInputStyle} />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter 10-digit phone number" pattern="[6-9][0-9]{9}" maxLength="10" required style={loginInputStyle} />
                <button type="submit" style={loginButtonStyle}>Login</button>
              </form>
              <small style={{ color: "#777" }}>This saves your details; it does not send an OTP.</small>
            </>
          ) : (
            <>
              <p>Admin access</p>
              <form onSubmit={handleAdminLogin}>
                <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="Admin username" required style={loginInputStyle} />
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" required style={loginInputStyle} />
                <button type="submit" style={loginButtonStyle}>Admin Login</button>
              </form>
            </>
          )}
          {message && <p style={{ color: "red", overflowWrap: "anywhere" }}>{message}</p>}
          <p style={{ color: "#888", marginTop: "25px" }}>Good food. Good mood. Happy cooking!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="brand" onClick={() => setPage("home")}>🍴 RecipeHub</button>
        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("recipes")}>Recipes</button>
          {isAdmin && <button onClick={() => { setMessage(""); setPage("add"); }}>Add Recipe</button>}
          <button onClick={() => { setMessage(""); setPage("profile"); }}>Profile</button>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>

      {message && <p className="success-message" style={{ textAlign: "center" }}>{message}</p>}

      {page === "home" && <>
        <section className="hero">
          <p className="eyebrow">YOUR DAILY DOSE OF DELICIOUS</p>
          <h1>Cook something <span>amazing.</span></h1>
          <p>Discover simple, tasty recipes for every day.</p>
          <div className="hero-search">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes or ingredients..." />
            <button onClick={() => setPage("recipes")}>Search</button>
          </div>
          <p className="hero-tags">🍲 Easy recipes　 🥗 Fresh ingredients　 ❤️ Made with love</p>
        </section>
        <main className="container">
          <div className="section-heading"><div><p className="eyebrow">HANDPICKED FOR YOU</p><h2>Popular Recipes</h2></div><button className="text-button" onClick={() => setPage("recipes")}>View all →</button></div>
          <RecipeGrid recipes={filteredRecipes.slice(0, 4)} onOpen={(r) => { setSelectedRecipe(r); setPage("details"); }} saved={saved} onSave={toggleSave} />
        </main>
      </>}

      {page === "recipes" && <main className="container page-content">
        <p className="eyebrow">EXPLORE YOUR NEXT MEAL</p><h1>All Recipes</h1>
        <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, cuisine, ingredient..." />
        <RecipeGrid recipes={filteredRecipes} onOpen={(r) => { setSelectedRecipe(r); setPage("details"); }} saved={saved} onSave={toggleSave} />
        {filteredRecipes.length === 0 && <p>No recipes found.</p>}
      </main>}

      {page === "details" && selectedRecipe && <main className="container page-content">
        <button className="back-button" onClick={() => setPage("recipes")}>← Back to recipes</button>
        <div className="detail-layout">
          <img className="detail-image" src={selectedRecipe.image} alt={selectedRecipe.name} />
          <div className="detail-content">
            <p className="eyebrow">{selectedRecipe.category}</p><h1>{selectedRecipe.name}</h1><p>⏱️ {selectedRecipe.time}</p>
            <button className="primary-button" onClick={() => toggleSave(selectedRecipe.id)}>{saved.includes(selectedRecipe.id) ? "♥ Saved" : "♡ Save Recipe"}</button>
            <h2>Ingredients</h2><ul className="ingredient-list">{(selectedRecipe.ingredients || []).map((item, i) => <li key={i}>✓ {item}</li>)}</ul>
            <h2>Preparation Steps</h2><ol className="steps-list">{(selectedRecipe.steps || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
          </div>
        </div>
      </main>}

      {page === "add" && isAdmin && <main className="form-container page-content">
        <p className="eyebrow">ADMIN ONLY</p><h1>Add a New Recipe</h1>
        <form onSubmit={addRecipe}>
          <label>Recipe Name *<input name="name" placeholder="e.g. Vegetable Pulao" required /></label>
          <label>Category *<input name="category" placeholder="e.g. Indian" required /></label>
          <label>Cooking Time<input name="time" placeholder="e.g. 30 min" /></label>
          <label>Image URL (optional)<input name="image" placeholder="Paste image URL" /></label>
          <label>Ingredients *<textarea name="ingredients" placeholder="Rice, onion, carrot" required /><small>Separate ingredients with commas.</small></label>
          <label>Preparation Steps *<textarea name="steps" placeholder={"Wash ingredients\nCook the food\nServe hot"} required /><small>Write each step on a new line.</small></label>
          <button className="primary-button" type="submit">+ Add Recipe</button>
        </form>
      </main>}

      {page === "profile" && <main className="profile-container page-content">
        <div className="profile-icon">👩‍🍳</div><p className="eyebrow">YOUR PERSONAL SPACE</p><h1>My Profile</h1>
        <p><strong>Name:</strong> {name}</p>
        {phone && <p><strong>Phone:</strong> {phone}</p>}
        <p><strong>Account:</strong> {isAdmin ? "Admin" : "User"}</p>
        <div className="profile-stats"><div><strong>{recipes.length}</strong><span>Recipes</span></div><div><strong>{saved.length}</strong><span>Saved Recipes</span></div></div>
        <h2>My Saved Recipes</h2>
        {recipes.filter((r) => saved.includes(r.id)).map((r) => <button className="saved-item" key={r.id} onClick={() => { setSelectedRecipe(r); setPage("details"); }}>{r.name} →</button>)}
        {saved.length === 0 && <p className="muted">Your saved recipes will appear here.</p>}
      </main>}

      <footer className="footer"><h2>🍴 RecipeHub</h2><p>Good food. Good mood. Happy cooking!</p><small>Food Recipe App · College Project</small></footer>
    </div>
  );
}

function RecipeGrid({ recipes, onOpen, saved, onSave }) {
  if (recipes.length === 0) return <p className="empty-state">No recipes found.</p>;
  return <div className="recipe-grid">
    {recipes.map((recipe) => <article className="recipe-card" key={recipe.id}>
      <div className="image-wrapper"><img src={recipe.image} alt={recipe.name} /><span className="category-badge">{recipe.category}</span><button className="heart-button" onClick={() => onSave(recipe.id)}>{saved.includes(recipe.id) ? "♥" : "♡"}</button></div>
      <div className="card-content"><p className="recipe-time">⏱️ {recipe.time}</p><h3>{recipe.name}</h3><button className="view-button" onClick={() => onOpen(recipe)}>View Recipe →</button></div>
    </article>)}
  </div>;
}

const loginInputStyle = { width: "100%", padding: "14px", margin: "10px 0", border: "1px solid #ddd", borderRadius: "8px", boxSizing: "border-box", fontSize: "16px" };
const loginButtonStyle = { width: "100%", padding: "14px", marginTop: "8px", background: "#e23744", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" };
const tabStyle = (active) => ({ flex: 1, padding: "10px", border: active ? "1px solid #e23744" : "1px solid #ddd", borderRadius: "8px", background: active ? "#fff0f0" : "white", color: active ? "#e23744" : "#555", cursor: "pointer" });

export default App;

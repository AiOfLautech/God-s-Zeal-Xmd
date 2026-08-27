# Complete item catalog for the economy bot

ITEMS = {
    # === TOOLS (Required for crime/gathering) ===
    "lockpick": {"name": "🔓 Lockpick", "price": 500, "category": "tools", "desc": "Required for burglary and heists", "emoji": "🔓"},
    "crowbar": {"name": "🔧 Crowbar", "price": 750, "category": "tools", "desc": "Required for robbery", "emoji": "🔧"},
    "ski_mask": {"name": "🎭 Ski Mask", "price": 300, "category": "tools", "desc": "Reduces robbery detection", "emoji": "🎭"},
    "hacking_kit": {"name": "💻 Hacking Kit", "price": 5000, "category": "tools", "desc": "Required for hacking", "emoji": "💻"},
    "fake_id": {"name": "🪪 Fake ID", "price": 2000, "category": "tools", "desc": "Required for scamming", "emoji": "🪪"},
    "gloves": {"name": "🧤 Gloves", "price": 200, "category": "tools", "desc": "No fingerprints", "emoji": "🧤"},
    "binoculars": {"name": "🔭 Binoculars", "price": 800, "category": "tools", "desc": "Scout targets", "emoji": "🔭"},
    "walkie_talkie": {"name": "📻 Walkie Talkie", "price": 1200, "category": "tools", "desc": "Required for gang heists", "emoji": "📻"},
    "wire_cutters": {"name": "✂️ Wire Cutters", "price": 600, "category": "tools", "desc": "Bypass security", "emoji": "✂️"},
    "disguise_kit": {"name": "🥸 Disguise Kit", "price": 1500, "category": "tools", "desc": "Better crime success", "emoji": "🥸"},
    "chloroform": {"name": "💉 Chloroform", "price": 3000, "category": "tools", "desc": "Required for kidnapping", "emoji": "💉"},
    "sniper_scope": {"name": "🔭 Sniper Scope", "price": 8000, "category": "tools", "desc": "Required for assassination", "emoji": "🔭"},
    "bribe_cash": {"name": "💰 Bribe Cash", "price": 1000, "category": "tools", "desc": "Bribe officials", "emoji": "💰"},
    "treasure_map": {"name": "🗺️ Treasure Map", "price": 2500, "category": "tools", "desc": "Find hidden treasure", "emoji": "🗺️"},
    
    # === WEAPONS ===
    "knife": {"name": "🔪 Knife", "price": 1000, "category": "weapons", "desc": "+10% duel win", "emoji": "🔪"},
    "baseball_bat": {"name": "🏏 Baseball Bat", "price": 1500, "category": "weapons", "desc": "+15% duel win", "emoji": "🏏"},
    "pistol": {"name": "🔫 Pistol", "price": 5000, "category": "weapons", "desc": "+25% duel win", "emoji": "🔫"},
    "rifle": {"name": "🎯 Rifle", "price": 15000, "category": "weapons", "desc": "+35% duel win", "emoji": "🎯"},
    "body_armor": {"name": "🛡️ Body Armor", "price": 8000, "category": "weapons", "desc": "-30% damage taken", "emoji": "🛡️"},
    "taser": {"name": "⚡ Taser", "price": 3000, "category": "weapons", "desc": "Stun opponent", "emoji": "⚡"},
    "katana": {"name": "⚔️ Katana", "price": 25000, "category": "weapons", "desc": "+45% duel win", "emoji": "⚔️"},
    "rpg": {"name": "🚀 RPG", "price": 100000, "category": "weapons", "desc": "+60% duel win", "emoji": "🚀"},
    
    # === GATHERING TOOLS ===
    "fishing_rod": {"name": "🎣 Fishing Rod", "price": 500, "category": "gathering", "desc": "Required for fishing", "emoji": "🎣"},
    "hunting_rifle": {"name": "🏹 Hunting Bow", "price": 2000, "category": "gathering", "desc": "Required for hunting", "emoji": "🏹"},
    "pickaxe": {"name": "⛏️ Pickaxe", "price": 1500, "category": "gathering", "desc": "Required for mining", "emoji": "⛏️"},
    "axe": {"name": "🪓 Axe", "price": 800, "category": "gathering", "desc": "Required for chopping", "emoji": "🪓"},
    "shovel": {"name": "🪏 Shovel", "price": 400, "category": "gathering", "desc": "Required for digging", "emoji": "🪏"},
    "net": {"name": "🥅 Net", "price": 1200, "category": "gathering", "desc": "Catch multiple fish", "emoji": "🥅"},
    "metal_detector": {"name": "📡 Metal Detector", "price": 3000, "category": "gathering", "desc": "Find buried treasure", "emoji": "📡"},
    
    # === CONSUMABLES ===
    "energy_drink": {"name": "🥤 Energy Drink", "price": 100, "category": "consumables", "desc": "Reset one cooldown", "emoji": "🥤"},
    "lucky_charm": {"name": "🍀 Lucky Charm", "price": 2500, "category": "consumables", "desc": "+20% luck 1hr", "emoji": "🍀"},
    "xp_boost": {"name": "⭐ XP Boost", "price": 3000, "category": "consumables", "desc": "2x XP 1hr", "emoji": "⭐"},
    "shield": {"name": "🛡️ Shield Token", "price": 5000, "category": "consumables", "desc": "Robbery protection 4hr", "emoji": "🛡️"},
    "bail_bond": {"name": "📜 Bail Bond", "price": 2000, "category": "consumables", "desc": "Get out of jail", "emoji": "📜"},
    "insurance_claim": {"name": "📋 Insurance Claim", "price": 10000, "category": "consumables", "desc": "Recover 50% losses", "emoji": "📋"},
    "golden_ticket": {"name": "🎫 Golden Ticket", "price": 50000, "category": "consumables", "desc": "VIP shop access", "emoji": "🎫"},
    "mystery_box": {"name": "📦 Mystery Box", "price": 5000, "category": "consumables", "desc": "Random rare item", "emoji": "📦"},
    "loan_voucher": {"name": "🏦 Loan Voucher", "price": 2000, "category": "consumables", "desc": "Reduce loan interest 50%", "emoji": "🏦"},
    
    # === COLLECTIBLES ===
    "trophy": {"name": "🏆 Trophy", "price": 25000, "category": "collectibles", "desc": "Show off wealth", "emoji": "🏆"},
    "diamond": {"name": "💎 Diamond", "price": 100000, "category": "collectibles", "desc": "Rare collectible", "emoji": "💎"},
    "crown": {"name": "👑 Crown", "price": 500000, "category": "collectibles", "desc": "Ultimate status", "emoji": "👑"},
    "rare_coin": {"name": "🪙 Rare Coin", "price": 10000, "category": "collectibles", "desc": "Collector's item", "emoji": "🪙"},
    "painting": {"name": "🖼️ Painting", "price": 75000, "category": "collectibles", "desc": "Fine art", "emoji": "🖼️"},
    "gem": {"name": "💍 Gem Ring", "price": 200000, "category": "collectibles", "desc": "Precious gem", "emoji": "💍"},
    
    # === FOOD ===
    "bread": {"name": "🍞 Bread", "price": 50, "category": "food", "desc": "Little energy", "emoji": "🍞"},
    "pizza": {"name": "🍕 Pizza", "price": 150, "category": "food", "desc": "Moderate energy", "emoji": "🍕"},
    "steak": {"name": "🥩 Steak", "price": 500, "category": "food", "desc": "Full energy", "emoji": "🥩"},
    "cake": {"name": "🎂 Cake", "price": 300, "category": "food", "desc": "Celebration!", "emoji": "🎂"},
    
    # === SMUGGLING ===
    "contraband_a": {"name": "📦 Contraband A", "price": 1000, "category": "smuggling", "desc": "Low-risk goods", "emoji": "📦"},
    "contraband_b": {"name": "📦 Contraband B", "price": 5000, "category": "smuggling", "desc": "Mid-risk goods", "emoji": "📦"},
    "contraband_c": {"name": "📦 Contraband C", "price": 20000, "category": "smuggling", "desc": "High-risk goods", "emoji": "📦"},
}

VEHICLES = {
    "bicycle": {"name": "🚲 Bicycle", "price": 1000, "speed": 10, "fuel_cost": 0, "desc": "Eco-friendly"},
    "scooter": {"name": "🛵 Scooter", "price": 5000, "speed": 30, "fuel_cost": 10, "desc": "Zippy ride"},
    "sedan": {"name": "🚗 Sedan", "price": 15000, "speed": 60, "fuel_cost": 25, "desc": "Family car"},
    "sports_car": {"name": "🏎️ Sports Car", "price": 75000, "speed": 120, "fuel_cost": 50, "desc": "Feel the speed"},
    "suv": {"name": "🚙 SUV", "price": 35000, "speed": 50, "fuel_cost": 40, "desc": "Off-road"},
    "truck": {"name": "🚛 Truck", "price": 50000, "speed": 40, "fuel_cost": 60, "desc": "Heavy hauler"},
    "motorcycle": {"name": "🏍️ Motorcycle", "price": 20000, "speed": 80, "fuel_cost": 15, "desc": "Fast & agile"},
    "luxury_car": {"name": "🚘 Luxury Car", "price": 200000, "speed": 100, "fuel_cost": 45, "desc": "Travel in style"},
    "supercar": {"name": "🏎️ Supercar", "price": 500000, "speed": 150, "fuel_cost": 70, "desc": "Top of line"},
    "helicopter": {"name": "🚁 Helicopter", "price": 1000000, "speed": 200, "fuel_cost": 100, "desc": "Skip traffic"},
    "yacht": {"name": "🛥️ Yacht", "price": 2000000, "speed": 50, "fuel_cost": 150, "desc": "Luxury water"},
    "tank": {"name": "🪖 Tank", "price": 5000000, "speed": 30, "fuel_cost": 200, "desc": "Ultimate vehicle"},
}

FUEL_PRICES = {
    "regular": {"name": "⛽ Regular Fuel", "price": 50, "amount": 25},
    "premium": {"name": "⛽ Premium Fuel", "price": 100, "amount": 50},
    "nitro": {"name": "🔥 Nitro Fuel", "price": 250, "amount": 100},
}

PROPERTIES = {
    "shack": {"name": "🏚️ Shack", "price": 5000, "income": 50, "desc": "A roof"},
    "apartment": {"name": "🏢 Apartment", "price": 25000, "income": 200, "desc": "City living"},
    "house": {"name": "🏠 House", "price": 75000, "income": 500, "desc": "Suburban"},
    "villa": {"name": "🏡 Villa", "price": 200000, "income": 1500, "desc": "Luxury"},
    "mansion": {"name": "🏰 Mansion", "price": 500000, "income": 3000, "desc": "Royalty"},
    "penthouse": {"name": "🌆 Penthouse", "price": 1000000, "income": 5000, "desc": "Top floor"},
    "island": {"name": "🏝️ Private Island", "price": 5000000, "income": 15000, "desc": "Paradise"},
    "bunker": {"name": "🏗️ Bunker", "price": 750000, "income": 2000, "desc": "Safe"},
    "warehouse": {"name": "🏭 Warehouse", "price": 150000, "income": 800, "desc": "Storage"},
    "casino": {"name": "🎰 Casino", "price": 3000000, "income": 10000, "desc": "House wins"},
}

JOBS = {
    "janitor": {"name": "🧹 Janitor", "salary": 100, "level_req": 0, "desc": "Starting job"},
    "cashier": {"name": "🏪 Cashier", "salary": 150, "level_req": 2, "desc": "Retail"},
    "mechanic": {"name": "🔧 Mechanic", "salary": 250, "level_req": 5, "desc": "Fix things"},
    "chef": {"name": "👨‍🍳 Chef", "salary": 300, "level_req": 8, "desc": "Cook profits"},
    "programmer": {"name": "💻 Programmer", "salary": 500, "level_req": 12, "desc": "Code for cash"},
    "doctor": {"name": "🩺 Doctor", "salary": 750, "level_req": 18, "desc": "Save lives"},
    "lawyer": {"name": "⚖️ Lawyer", "salary": 800, "level_req": 22, "desc": "Argue money"},
    "pilot": {"name": "✈️ Pilot", "salary": 1000, "level_req": 28, "desc": "Fly high"},
    "ceo": {"name": "🏢 CEO", "salary": 2000, "level_req": 35, "desc": "Run the show"},
    "astronaut": {"name": "🚀 Astronaut", "salary": 5000, "level_req": 50, "desc": "To the moon!"},
}

SKILLS = {
    "strength": {"name": "💪 Strength", "desc": "Better combat"},
    "stealth": {"name": "🥷 Stealth", "desc": "Higher crime success"},
    "intelligence": {"name": "🧠 Intelligence", "desc": "Better hacking"},
    "charisma": {"name": "🗣️ Charisma", "desc": "Better begging"},
    "luck": {"name": "🍀 Luck", "desc": "Better gambling"},
    "endurance": {"name": "🏃 Endurance", "desc": "Reduced cooldowns"},
    "fishing": {"name": "🎣 Fishing", "desc": "Better catches"},
    "mining": {"name": "⛏️ Mining", "desc": "Rarer minerals"},
    "hunting": {"name": "🏹 Hunting", "desc": "Bigger game"},
    "cooking": {"name": "👨‍🍳 Cooking", "desc": "Valuable meals"},
}

ACHIEVEMENTS = {
    "first_daily": {"name": "First Day!", "desc": "Claim first daily", "reward": 100},
    "millionaire": {"name": "Millionaire", "desc": "1M net worth", "reward": 10000},
    "crime_lord": {"name": "Crime Lord", "desc": "100 crimes", "reward": 25000},
    "collector": {"name": "Collector", "desc": "Own 20 items", "reward": 5000},
    "landlord": {"name": "Landlord", "desc": "Own 5 properties", "reward": 15000},
    "car_enthusiast": {"name": "Car Enthusiast", "desc": "Own 5 vehicles", "reward": 10000},
    "high_roller": {"name": "High Roller", "desc": "Win 100k gambling", "reward": 20000},
    "gang_leader": {"name": "Gang Leader", "desc": "Create a gang", "reward": 5000},
    "prestige_1": {"name": "Prestige I", "desc": "First prestige", "reward": 50000},
    "master_fisher": {"name": "Master Fisher", "desc": "Catch 100 fish", "reward": 8000},
    "loan_shark": {"name": "Loan Shark", "desc": "Repay 10 loans", "reward": 15000},
    "generous": {"name": "Generous", "desc": "Transfer 100k total", "reward": 5000},
}

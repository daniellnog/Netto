-- Migrate Account.icon from emoji to Lucide icon name strings
UPDATE "Account" SET "icon" = CASE "icon"
  WHEN '💳' THEN 'CreditCard'
  WHEN '🏦' THEN 'Building2'
  WHEN '💰' THEN 'Coins'
  WHEN '🏧' THEN 'Landmark'
  WHEN '💵' THEN 'Banknote'
  WHEN '📊' THEN 'ChartBar'
  WHEN '🏠' THEN 'House'
  WHEN '✈️' THEN 'Plane'
  WHEN '🎯' THEN 'Target'
  WHEN '💼' THEN 'Briefcase'
  ELSE 'CreditCard'
END
WHERE "icon" NOT IN (
  'CreditCard','Building2','Coins','Landmark','Banknote',
  'ChartBar','House','Plane','Target','Briefcase','Wallet','Gem'
);

-- Migrate Category.icon from emoji to Lucide icon name strings
UPDATE "Category" SET "icon" = CASE "icon"
  WHEN '🛒' THEN 'ShoppingCart'
  WHEN '🍔' THEN 'Utensils'
  WHEN '🍕' THEN 'Pizza'
  WHEN '☕' THEN 'Coffee'
  WHEN '🚗' THEN 'Car'
  WHEN '✈️' THEN 'Plane'
  WHEN '🏥' THEN 'HeartPulse'
  WHEN '📚' THEN 'BookOpen'
  WHEN '🎮' THEN 'Gamepad2'
  WHEN '👗' THEN 'Shirt'
  WHEN '💊' THEN 'Pill'
  WHEN '🔧' THEN 'Wrench'
  WHEN '🏠' THEN 'House'
  WHEN '💡' THEN 'Lightbulb'
  WHEN '📱' THEN 'Smartphone'
  WHEN '🎬' THEN 'Film'
  WHEN '🎵' THEN 'Music'
  WHEN '🐾' THEN 'PawPrint'
  WHEN '🏋️' THEN 'Dumbbell'
  WHEN '💰' THEN 'Coins'
  WHEN '💵' THEN 'Banknote'
  WHEN '📈' THEN 'TrendingUp'
  WHEN '💼' THEN 'Briefcase'
  WHEN '🎁' THEN 'Gift'
  WHEN '⭐' THEN 'Star'
  WHEN '🎯' THEN 'Target'
  WHEN '🏦' THEN 'Building2'
  WHEN '💎' THEN 'Gem'
  WHEN '🌍' THEN 'Globe'
  WHEN '📂' THEN 'FolderOpen'
  ELSE 'FolderOpen'
END
WHERE "icon" NOT IN (
  'ShoppingCart','Utensils','Pizza','Coffee','Car','Plane','HeartPulse',
  'BookOpen','Gamepad2','Shirt','Pill','Wrench','House','Lightbulb',
  'Smartphone','Film','Music','PawPrint','Dumbbell','Coins','Banknote',
  'TrendingUp','Briefcase','Gift','Star','Target','Building2','Gem','Globe','FolderOpen'
);

-- Migrate CreditCard.icon from emoji to Lucide icon name strings
UPDATE "CreditCard" SET "icon" = CASE "icon"
  WHEN '💳' THEN 'CreditCard'
  WHEN '🌐' THEN 'Globe'
  WHEN '💎' THEN 'Gem'
  WHEN '⭐' THEN 'Star'
  WHEN '🪙' THEN 'Coins'
  WHEN '💵' THEN 'Banknote'
  WHEN '🎯' THEN 'Target'
  WHEN '💼' THEN 'Briefcase'
  ELSE 'CreditCard'
END
WHERE "icon" NOT IN (
  'CreditCard','Globe','Gem','Star','Coins','Banknote','Target','Briefcase'
);

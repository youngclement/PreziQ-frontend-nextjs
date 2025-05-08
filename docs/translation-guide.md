# Internationalization Guide for PreziQ

This guide explains how to implement multilingual support (Vietnamese and English) in your components.

## Overview

The application uses `i18next` and our custom language context to provide translations. We currently support:

- English (`en`) - Default language
- Vietnamese (`vi`)

## Adding New Translations

All translations are stored in the `contexts/language-context.tsx` file. When you need to add new text:

1. Add a new key-value pair to the English translation object
2. Add the corresponding Vietnamese translation

Example:

```tsx
"myFeature": "My Feature", // English
"myFeature": "Tính năng của tôi", // Vietnamese
```

## Using Translations in Components

There are multiple ways to use translations in your components:

### Method 1: Using the `useLanguage` hook

```tsx
import { useLanguage } from "@/contexts/language-context";

function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("pageTitle")}</h1>
      <p>{t("pageDescription")}</p>
    </div>
  );
}
```

### Method 2: Using the `TranslatedText` component

For simple text elements, use our utility component:

```tsx
import TranslatedText from "@/components/ui/translated-text";

function MyComponent() {
  return (
    <div>
      <TranslatedText
        text="This will be translated"
        translationKey="myTranslationKey"
      />

      {/* You can use it with different HTML elements */}
      <TranslatedText
        text="Heading"
        translationKey="headingKey"
        as="h2"
        className="text-2xl font-bold"
      />
    </div>
  );
}
```

### Method 3: Using the `withTranslation` HOC

For wrapping existing components:

```tsx
import { Button } from "@/components/ui/button";
import { withTranslation } from "@/components/ui/translated-text";

// Create a translated version of the Button component
const TranslatedButton = withTranslation(Button);

function MyComponent() {
  return <TranslatedButton translationKey="saveButton">Save</TranslatedButton>;
}
```

## Testing Translations

To test your translations:

1. Use the language toggle in the header to switch between languages
2. Make sure to test all user flows in both languages
3. Check for text overflow or layout issues in Vietnamese (which may be longer than English)

## Tips for Good Localization

1. Avoid hardcoded strings in your components
2. Use translation keys that are descriptive of what they represent
3. Organize translations by feature or page in the language context
4. Be mindful of text length differences between languages
5. Test regularly in both languages when making UI changes

## Adding Support for New Languages

To add a new language:

1. Add a new language code and translations to the resources in `contexts/language-context.tsx`
2. Add a new option in the `LanguageToggle` component
3. Test the UI in the new language

If you have any questions about translations, please contact the team lead.

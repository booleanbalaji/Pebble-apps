// Clay settings configuration for Tutorial Watchface
module.exports = [
  {
    type: "heading",
    defaultValue: "Tutorial Watchface Settings",
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Display",
        size: 4,
      },
      {
        type: "toggle",
        messageKey: "SHOW_DATE",
        label: "Show Date",
        defaultValue: true,
      },
      {
        type: "select",
        messageKey: "HOUR_FORMAT",
        label: "Hour Format",
        defaultValue: "12",
        options: [
          { label: "12-hour", value: "12" },
          { label: "24-hour", value: "24" },
        ],
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Colors",
        size: 4,
      },
      {
        type: "color",
        messageKey: "BG_COLOR",
        label: "Background Color",
        defaultValue: "000000",
        sunlight: true,
      },
      {
        type: "color",
        messageKey: "TEXT_COLOR",
        label: "Text Color",
        defaultValue: "FFFFFF",
        sunlight: true,
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Weather",
        size: 4,
      },
      {
        type: "select",
        messageKey: "TEMPERATURE_UNIT",
        label: "Temperature Unit",
        defaultValue: "C",
        options: [
          { label: "Celsius (°C)", value: "C" },
          { label: "Fahrenheit (°F)", value: "F" },
        ],
      },
    ],
  },
  {
    type: "submit",
    defaultValue: "Save Settings",
  },
];

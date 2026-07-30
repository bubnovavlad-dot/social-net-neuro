# NeuroCafe Native UX Proposal Figma Plugin

Локальный Figma-плагин для обычного Design Mode. Он создаёт редактируемый блок
`NeuroCafe SocialNet v2 / native UX proposal` в файле `НейроМир` и скрывает
старый reference-слой `NeuroCafe SocialNet v2` (`785:1141`), если он есть.

## Как запустить

1. В Figma нажать `Back to Design Mode`.
2. Открыть меню Figma в левом верхнем углу.
3. Выбрать `Plugins` -> `Development` -> `Import plugin from manifest...`.
4. Указать этот файл:
   `/Users/andreybubnov/Library/Mobile Documents/com~apple~CloudDocs/-=Атмосфера=-/!!!Анализ/social-net-neuro/figma-plugin-neurocafe-native-proposal/manifest.json`
5. Запустить `Plugins` -> `Development` -> `NeuroCafe Native UX Proposal`.

Если файл открыт с правом редактирования, плагин создаст native-экраны в Figma:
лента, отклик, челлендж, друзья, обязательные состояния, desktop handoff и UX
logic notes. Тексты останутся Figma TEXT, а карточки и кнопки будут обычными
FRAME/RECTANGLE-слоями.

## Что обновлено после проверки этапа 2

- Добавлены состояния `Отклик опубликован`, короткий/повторный отклик, закрытая цель дня, пустая лента и нет друзей.
- Персональный челлендж объясняет причину назначения по прошлой активности.
- Друзья начинаются с поддержки и команды практики, а не с реферального сценария.
- Desktop handoff показывает центральную ленту, цель дня сверху и правый контекст.
- Launch/admin-материалы вынесены в отдельный блок вне пользовательского телефона.

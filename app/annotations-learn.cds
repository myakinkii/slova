
annotate MyService.Translations with @odata.draft.enabled;

annotate MyService.Translations with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate MyService.Translations with {
    value @UI.MultiLineText;
}

annotate MyService.Translations with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Translation}',
        TypeNamePlural: '{i18n>Translations}',
        Title         : {Value: slovo.morphem},
        // Description   : {Value: slovo.lang}
        Description   : {Value: {$edmJson: {
            $Apply   : [
                {Path: 'slovo/lang'},
                ' -> ',
                {Path: 'lang_code'}
            ],
            $Function: 'odata.concat'
        }}}
    },
    LineItem               : [
        {Value: author_id},
        {Value: lang_code},
        {Value: value}
    ],
    FieldGroup #Translation: {Data: [{Value: value}]},
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Translation',
        Label : '{i18n>translation}'
    }]
};

annotate MyService.Cards with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Card}',
        TypeNamePlural: '{i18n>Cards}',
        Title         : {Value: slovo.morphem},
        // Description   : {Value: slovo.lang},
        Description   : {Value: {$edmJson: {
            $Apply   : [
                {Path: 'slovo/lang'},
                ' -> ',
                {Path: 'translation/lang_code'}
            ],
            $Function: 'odata.concat'
        }}}
    },
    LineItem               : [
        // {Value: slovo.lang},
        // {Value: slovo.morphem  },
        // {Value: slovo.pos},
        {
            Value: what,
            Label: '{i18n>morphem}'
        },
        {
            Value: how,
            Label: '{i18n>lang}'
        },
        // {Value: translation.lang},
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'MyService.guessCard',
            Label  : '{i18n>guessCard}',
            IconUrl: 'sap-icon://travel-request',
            Inline : true
        }
    ],
    FieldGroup #Translation: {Data: [{Value: translation.value, }]},
    Facets                 : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Translation',
            Label : '{i18n>translation}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'history/@UI.LineItem',
            Label : '{i18n>history}'
        }
    ]
};

annotate MyService.CardGuesses with @UI: {LineItem: [
    {Value: guess},
    {Value: now}
]};

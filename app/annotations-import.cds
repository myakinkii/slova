annotate ImportService.Import with @odata.draft.enabled;

annotate ImportService.Import with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {
        Insertable        : true,
        RequiredProperties: ['lang_code']
    },
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate ImportService.Import with {
    text @UI.MultiLineText;
}

annotate ImportService.Import with {
    pos     @(
        ValueList.entity: 'PartsOfSpeech',
        Common.ValueListWithFixedValues
    );
    ![case] @(
        ValueList.entity: 'Cases',
        Common.ValueListWithFixedValues
    );
    gender  @(
        ValueList.entity: 'Genders',
        Common.ValueListWithFixedValues
    );
    number  @(
        ValueList.entity: 'Numbers',
        Common.ValueListWithFixedValues
    );
    person  @(
        ValueList.entity: 'Persons',
        Common.ValueListWithFixedValues
    );
    tense   @(
        ValueList.entity: 'Tenses',
        Common.ValueListWithFixedValues
    );
    aspect  @(
        ValueList.entity: 'Aspects',
        Common.ValueListWithFixedValues
    );
    mood    @(
        ValueList.entity: 'Moods',
        Common.ValueListWithFixedValues
    );
    degree  @(
        ValueList.entity: 'Degrees',
        Common.ValueListWithFixedValues
    );
    voice   @(
        ValueList.entity: 'Voices',
        Common.ValueListWithFixedValues
    );
    verbForm   @(
        ValueList.entity: 'VerbForms',
        Common.ValueListWithFixedValues
    );
}

annotate ImportService.Import with @UI: {
    HeaderInfo            : {
        TypeName      : '{i18n>Import}',
        TypeNamePlural: '{i18n>Imports}',
        Title         : {Value: lang_code},
        Description   : {Value: name}
    },
    LineItem              : [
        {Value: createdBy},
        {Value: name},
        {Value: lang_code}
    ],
    Identification        : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'ImportService.parseInput',
            Label : '{i18n>import.parseInput}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'ImportService.mergeResults',
            Label : '{i18n>import.mergeResults}'
        }
    ],
    Facets                : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Text',
            Label : '{i18n>input}'
        },{
            $Type        : 'UI.CollectionFacet',
            Label        : '{i18n>Config}',
            ID           : 'ConfigFacet',
            ![@UI.Hidden]: IsActiveEntity,
            Facets       : [
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#Sentence',
                    Label : '{i18n>newSentence}'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#Word',
                    Label : '{i18n>newWord}'
                },
            ]
        },
        {
            $Type        : 'UI.CollectionFacet',
            Label        : '{i18n>features}',
            ID           : 'FeatsFacet',
            ![@UI.Hidden]: IsActiveEntity,
            Facets       : [
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#FeatsNoun',
                    Label : '{i18n>feats.noun}'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#FeatsOther',
                    Label : '{i18n>feats.other}'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#FeatsVerb',
                    Label : '{i18n>feats.verb}'
                }
            ]
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'words/@UI.LineItem',
            Label        : '{i18n>Words}',
            ![@UI.Hidden]: HasDraftEntity
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'sentences/@UI.LineItem',
            Label        : '{i18n>Sentences}',
            ![@UI.Hidden]: HasDraftEntity
        }
    ],
    FieldGroup #Text      : {Data: [
        {
            $Type            : 'UI.DataFieldForAction',
            Action           : 'ImportService.askHelp',
            Label            : '{i18n>askHelp}',
            ![@UI.Emphasized]: false,
            Inline           : false
        },        
        {Value: text}
    ]},
    FieldGroup #Sentence  : {Data: [
        {
            $Type            : 'UI.DataFieldForAction',
            Action           : 'ImportService.addSentence',
            Label            : '{i18n>addSentence}',
            ![@UI.Emphasized]: false,
            Inline           : true
        },
        {Value: sent}
    ]},
    FieldGroup #Word      : {Data: [
        {
            $Type            : 'UI.DataFieldForAction',
            Action           : 'ImportService.addWord',
            Label            : '{i18n>addWord}',
            ![@UI.Emphasized]: false,
            Inline           : true
        },
        {Value: indx},
        {Value: lemma},
        {Value: pos_code},
        {Value: feats}
    ]},
    FieldGroup #FeatsNoun : {Data: [
        {Value: case_code},
        {Value: gender_code},
        {Value: number_code},
    ]},
    FieldGroup #FeatsVerb : {Data: [
        {Value: person_code},
        {Value: tense_code},
        {Value: aspect_code},
        {Value: mood_code},
    ]},
    FieldGroup #FeatsOther: {Data: [
        {Value: voice_code},
        {Value: degree_code},
        {Value: verbForm_code}
    ]},
};

annotate ImportService.Sentences with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: text},
        Description   : {Value: hash}
    },
    LineItem               : [{Value: text}],
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'tokens/@UI.LineItem',
        Label : '{i18n>Tokens}'
    }],
    HeaderFacets           : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Translation',
    }],
    FieldGroup #Translation: {Data: [{
        Label: '{i18n>translation}',
        Value: translation,
        Url  : translation,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate ImportService.Sentences.tokens with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Token}',
        TypeNamePlural: '{i18n>Tokens}'
    },
    LineItem  : [
        {Value: index},
        {Value: form},
        {Value: lemma},
        {Value: pos}
    ]
};

annotate ImportService.Slova.sentences with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: sent.text},
        Description   : {Value: sent.hash}
    },
    LineItem  : [{Value: sent.text}]
};

annotate ImportService.Slova with @UI: {
    LineItem  : [
        {Value: pos},
        {Value: morphem},
        {Value: count}
    ],
    HeaderInfo: {
        TypeName      : '{i18n>Slovo}',
        TypeNamePlural: '{i18n>Slova}',
        Title         : {Value: morphem},
        Description   : {Value: occurence}
    },
    Facets    : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'forms/@UI.LineItem',
            Label : '{i18n>forms}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'sentences/@UI.LineItem',
            Label : '{i18n>sentences}'
        }
    ]
};

annotate ImportService.Forms with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Form}',
        TypeNamePlural: '{i18n>Forms}',
        Title         : {Value: form}
    },
    LineItem  : [
        {Value: form},
        {Value: ![Case]},
        {Value: Gender},
        {Value: Number},
        {Value: Animacy},
        {Value: Tense},
        {Value: Aspect},
        {Value: Mood},
        {Value: Voice},
        {Value: Person},
        {Value: VerbForm},
        {Value: PronType},
        {Value: Reflex}
    ]
};

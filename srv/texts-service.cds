using {cc.slova.model as db} from '../db/schema';

@path    : '/texts'
@requires: 'authenticated-user'
service TextsService {


    @readonly
    entity PosFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from SlovaDistinct {
            pos        as code,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            pos;

    @readonly
    entity LangsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from SlovaDistinct {
            lang       as code,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            lang;

    @readonly
    entity SlovaDistinct as
        select distinct
            pos,
            morphem,
            lang,
            createdBy,
            status
        from Slova
        where
               createdBy = $user
            or status    = 9;

    @readonly
    entity TextsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from Slova {
            import.ID   as code,
            import.name as text,
            createdBy,
            status,
            count( * )  as count : Integer
        }
        group by
            import.ID
        order by
            text asc;

    @readonly
    entity AuthorsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from Texts {
            createdBy  as code,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            createdBy;

    type Token {
        importId : UUID;
        hash     : String;
        index    : Integer;
        lemma    : String;
        pos      : String;
        feats    : String;
    }

    action syncToken(token : Token);
    action getDefinition(lang : String, lemma : String) returns String;

    @(Common.SideEffects: {TargetEntities: [
        '/TextsService.EntityContainer/Texts',
        '/TextsService.EntityContainer/PosFilter',
        '/TextsService.EntityContainer/LangsFilter',
        '/TextsService.EntityContainer/TextsFilter',
        '/TextsService.EntityContainer/AuthorsFilter'
    ]})
    action createText(input : String)                   returns Texts;

    entity Texts @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user',
            where: 'createdBy = $user or status = 9'
        },
        {
            grant: [
                'WRITE',
                'parseText',
                'generateText'
            ],
            to   : 'authenticated-user',
            where: 'createdBy = $user'
        }
    ])                   as projection on db.Import order by
        name asc
    actions {

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {
                TargetEntities  : [
                    '_it/sentences',
                    '_it/words'
                ],
                TargetProperties: [
                    '_it/text',
                    '_it/input'
                ]
            }
        )
        action parseText();

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetProperties: ['_it/input']}
        )
        action generateText();
    };

    @readonly
    entity Sentences @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as projection on db.ImportSentences {
        *,
        import.createdBy,
        import.status
    } order by
        index asc;

    @readonly
    entity Slova @(restrict: [{
        grant: [
            'READ',
            'toggleSkip'
        ],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from db.ImportWords
        mixin {
            skip : Association to db.Skips
                       on  skip.slovo.morphem = morphem
                       and skip.slovo.lang    = lang
                       and skip.slovo.pos     = pos
                       and skip.user.id       = $user
        }
        into {
            *,
            import.createdBy,
            import.status,
            case
                when
                    skip.user.id is null
                then
                    false
                else
                    true
            end as skip : Boolean
        } actions {
            @(Common.SideEffects: {TargetEntities: ['/TextsService.EntityContainer/Slova']})
            action toggleSkip() returns Boolean;
        };

    @readonly
    entity Forms         as projection on db.ImportForms;

    @readonly
    entity PartsOfSpeech as projection on db.PartsOfSpeech;

    @readonly
    entity Cases         as projection on db.Cases;

    @readonly
    entity Genders       as projection on db.Genders;

    @readonly
    entity Numbers       as projection on db.Numbers;

    @readonly
    entity Persons       as projection on db.Persons;

    @readonly
    entity Tenses        as projection on db.Tenses;

    @readonly
    entity Aspects       as projection on db.Aspects;

    @readonly
    entity Moods         as projection on db.Moods;

    @readonly
    entity Voices        as projection on db.Voices;

    @readonly
    entity Degrees       as projection on db.Degrees;

    @readonly
    entity VerbForms     as projection on db.VerbForms;

    @readonly
    entity Languages     as projection on db.Languages;

    @readonly
    entity TextTypes     as projection on db.TextTypes;

    @readonly
    entity TextSizes     as projection on db.TextSizes;

    @readonly
    entity TextLocations as projection on db.TextLocations;

    @readonly
    entity TextModifiers as projection on db.TextModifiers;

    @odata.singleton
    entity Profile       as
        select from db.Users
        where
            id = $user;
}

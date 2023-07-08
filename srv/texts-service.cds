using {cc.slova.model as db} from '../db/schema';

@path    : '/texts'
@requires: 'authenticated-user'
service TextsService {

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

    @(Common.SideEffects: {TargetEntities: ['/TextsService.EntityContainer/Texts']})
    action createText();

    entity Texts @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user',
            where: 'createdBy = $user or status = 9'
        },
        {
            grant: [
                'WRITE',
                'parseText'
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
    };

    @readonly
    entity Sentences     as projection on db.ImportSentences order by
        index asc;

    @readonly
    entity Slova         as projection on db.ImportWords;

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
}

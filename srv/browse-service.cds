using {cc.slova.model as db} from '../db/schema';

@path    : '/browse'
@requires: 'authenticated-user'
service UserService {

    @readonly
    entity Languages as projection on db.Languages;

    @readonly
    entity Slova     as projection on db.Slova actions {
        action makeCard();

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetEntities: ['_it/translations']}
        )
        action addTranslation(value : String) returns Translations;
    };

    @readonly
    entity Forms     as projection on db.Forms;

    @readonly
    entity Etymology as projection on db.Etymology;

    @readonly
    entity Sentences as projection on db.Sentences;

    @readonly
    entity Tokens    as projection on db.Tokens;

    entity Translations @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'author_id = $user'
        }
    ])               as projection on db.Translations;

    entity Users @(restrict: [{
        grant: [
            'READ',
            'UPDATE'
        ],
        to   : 'authenticated-user',
        where: 'id = $user'
    }])              as projection on db.Users;

}

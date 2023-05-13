using {ru.dev4hana.slova as db} from '../db/schema';

@path    : '/import'
@requires: 'admin-user'
service ImportService {

    entity Import as projection on db.Import actions {

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetEntities: ['_it/sentences','_it/words']}
        )
        action parseInput();
        action mergeResults();
    };

    @readonly
    entity Sentences as projection on db.ImportSentences;

    @readonly
    entity Slova as projection on db.ImportWords;

    @readonly
    entity Forms as projection on db.ImportForms;
}

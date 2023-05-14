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

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetProperties: ['_it/text','_it/sent','_it/indx','_it/lemma','_it/pos_code','_it/feats']}
        )
        action addSentence();

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetProperties: ['_it/text','_it/indx','_it/lemma','_it/pos_code','_it/feats','_it/case_code','_it/gender_code','_it/number_code','_it/person_code','_it/tense_code','_it/aspect_code','_it/mood_code','_it/voice_code','_it/degree_code','_it/verbForm_code' ]}
        )
        action addWord();
    };

    @readonly
    entity Sentences as projection on db.ImportSentences;

    @readonly
    entity Slova as projection on db.ImportWords;

    @readonly
    entity Forms as projection on db.ImportForms;
    
    @readonly
    entity PartsOfSpeech as projection on db.PartsOfSpeech;
    @readonly
    entity Cases as projection on db.Cases;
    @readonly
    entity Genders as projection on db.Genders;
    @readonly
    entity Numbers as projection on db.Numbers;
    @readonly
    entity Persons as projection on db.Persons;
    @readonly
    entity Tenses as projection on db.Tenses;
    @readonly
    entity Aspects as projection on db.Aspects;
    @readonly
    entity Moods as projection on db.Moods;
    @readonly
    entity Voices as projection on db.Voices;
    @readonly
    entity Degrees as projection on db.Degrees;
    @readonly
    entity VerbForms as projection on db.VerbForms;
}

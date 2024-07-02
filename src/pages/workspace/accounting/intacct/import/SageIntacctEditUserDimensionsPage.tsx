import type {StackScreenProps} from '@react-navigation/stack';
import React, {useCallback, useState} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import ConfirmModal from '@components/ConfirmModal';
import ConnectionLayout from '@components/ConnectionLayout';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import * as Expensicons from '@components/Icon/Expensicons';
import MenuItem from '@components/MenuItem';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import TextInput from '@components/TextInput';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {clearSageIntacctErrorField, editSageIntacctUserDimensions, removeSageIntacctUserDimensions} from '@libs/actions/connections/SageIntacct';
import * as ErrorUtils from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import INPUT_IDS from '@src/types/form/SageIntacctDimensionsForm';
import DimensionTypeSelector from './DimensionTypeSelector';

type SageIntacctEditUserDimensionPageProps = StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_EDIT_USER_DIMENSION>;

function SageIntacctEditUserDimensionPage({route}: SageIntacctEditUserDimensionPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const editedUserDimensionName: string = route.params.dimensionName;
    const [policy] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${route.params.policyID ?? '-1'}`);
    const policyID: string = policy?.id ?? '-1';
    const config = policy?.connections?.intacct?.config;
    const userDimensions = policy?.connections?.intacct?.config?.mappings?.dimensions;
    const editedUserDimension = userDimensions?.find((userDimension) => userDimension.name === editedUserDimensionName);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const validate = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.SAGE_INTACCT_DIMENSION_TYPE_FORM>) => {
            const errors: FormInputErrors<typeof ONYXKEYS.FORMS.SAGE_INTACCT_DIMENSION_TYPE_FORM> = {};

            if (!values[INPUT_IDS.INTEGRATION_NAME]) {
                ErrorUtils.addErrorMessage(errors, INPUT_IDS.INTEGRATION_NAME, translate('common.error.fieldRequired'));
            }

            if (userDimensions?.some((userDimension) => userDimension.name === values[INPUT_IDS.INTEGRATION_NAME] && editedUserDimensionName !== values[INPUT_IDS.INTEGRATION_NAME])) {
                ErrorUtils.addErrorMessage(errors, INPUT_IDS.INTEGRATION_NAME, translate('workspace.intacct.dimensionExists'));
            }

            if (!values[INPUT_IDS.DIMENSION_TYPE]) {
                ErrorUtils.addErrorMessage(errors, INPUT_IDS.DIMENSION_TYPE, translate('common.error.fieldRequired'));
            }
            return errors;
        },
        [editedUserDimensionName, translate, userDimensions],
    );

    return (
        <ConnectionLayout
            displayName={SageIntacctEditUserDimensionPage.displayName}
            headerTitleAlreadyTranslated={editedUserDimensionName}
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            contentContainerStyle={styles.flex1}
            titleStyle={styles.ph5}
            connectionName={CONST.POLICY.CONNECTIONS.NAME.SAGE_INTACCT}
        >
            <FormProvider
                style={[styles.flexGrow1, styles.ph5]}
                formID={ONYXKEYS.FORMS.SAGE_INTACCT_DIMENSION_TYPE_FORM}
                validate={validate}
                onSubmit={(value) => {
                    editSageIntacctUserDimensions(policyID, editedUserDimensionName, value[INPUT_IDS.INTEGRATION_NAME], value[INPUT_IDS.DIMENSION_TYPE], userDimensions ?? []);
                    Navigation.goBack(ROUTES.POLICY_ACCOUNTING_SAGE_INTACCT_USER_DIMENSIONS.getRoute(policyID));
                }}
                submitButtonText={translate('common.save')}
                enabledWhenOffline
                shouldValidateOnBlur
                shouldValidateOnChange
            >
                <OfflineWithFeedback
                    pendingAction={config?.pendingFields?.[`dimension_${editedUserDimensionName}`]}
                    errors={config?.errorFields?.[`dimension_${editedUserDimensionName}`]}
                    onClose={() => clearSageIntacctErrorField(policyID, `dimension_${editedUserDimensionName}`)}
                >
                    <View style={[styles.mb4]}>
                        <InputWrapper
                            InputComponent={TextInput}
                            inputID={INPUT_IDS.INTEGRATION_NAME}
                            label={translate('workspace.intacct.integrationName')}
                            aria-label={translate('workspace.intacct.integrationName')}
                            role={CONST.ROLE.PRESENTATION}
                            spellCheck={false}
                            defaultValue={editedUserDimensionName}
                        />
                    </View>
                    <View style={[]}>
                        <InputWrapper
                            InputComponent={DimensionTypeSelector}
                            inputID={INPUT_IDS.DIMENSION_TYPE}
                            aria-label="dimensionTypeSelector"
                            defaultValue={editedUserDimension?.mapping}
                        />
                    </View>
                    <View style={[styles.mhn5]}>
                        <MenuItem
                            title={translate('common.remove')}
                            icon={Expensicons.Trashcan}
                            onPress={() => setIsDeleteModalOpen(true)}
                        />
                    </View>
                </OfflineWithFeedback>
                <ConfirmModal
                    title={translate('workspace.intacct.removeDimension')}
                    isVisible={isDeleteModalOpen}
                    onConfirm={() => {
                        setIsDeleteModalOpen(false);
                        removeSageIntacctUserDimensions(policyID, editedUserDimensionName, userDimensions);
                        Navigation.goBack();
                    }}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    prompt={translate('workspace.intacct.removeDimensionPrompt')}
                    confirmText={translate('common.remove')}
                    cancelText={translate('common.cancel')}
                    danger
                    shouldEnableNewFocusManagement
                />
            </FormProvider>
        </ConnectionLayout>
    );
}

SageIntacctEditUserDimensionPage.displayName = 'PolicySageIntacctEditUserDimensionPage';

export default SageIntacctEditUserDimensionPage;

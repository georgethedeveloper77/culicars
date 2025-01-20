import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:remixicon/remixicon.dart';

import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../config/ps_colors.dart';
import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../core/vendor/provider/product/item_entry_provider.dart';
import '../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../core/vendor/viewobject/custom_field.dart';
import '../../../../../../core/vendor/viewobject/product.dart';

class ProductSpecificationWidget extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _SpecificationWidgetState();
}

class _SpecificationWidgetState extends State<ProductSpecificationWidget> {
  List<CustomField> customFieldList = <CustomField>[];
  String plate = 'ps-itm00015';
  String plateValue = '';
  CustomField plateCustomField = CustomField(visible: '0');

  String enginePower = 'ps-itm00016';
  String enginePowerValue = '';
  CustomField enginePowerCustomField = CustomField(visible: '0');

  String transmission = 'ps-itm00014';
  String transmissionValue = '';
  CustomField transmissionCustomField = CustomField(visible: '0');

  String mileage = 'ps-itm00026';
  String mileageValue = '';
  CustomField mileageCustomField = CustomField(visible: '0');

  String licenseExpirationDate = 'ps-itm00027';
  String licenseExpirationDateValue = '';
  CustomField licenseExpirationDateCustomField = CustomField(visible: '0');

  String year = 'ps-itm00022';
  String yearValue = '';
  CustomField yearCustomField = CustomField(visible: '0');

  String condition = 'ps-itm00004';
  String conditionValue = '';
  CustomField conditionCustomField = CustomField(visible: '0');

  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider itemDetailProvider =
        Provider.of<ItemDetailProvider>(context);
    final Product product = itemDetailProvider.product;
    return SliverToBoxAdapter(
      child: Consumer<ItemEntryFieldProvider>(builder: (BuildContext context,
          ItemEntryFieldProvider provider, Widget? child) {
        plateCustomField = provider.getCustomFieldByCoreKeyId(plate);
        if (plateCustomField.isVisible)
          plateValue = product.selectedValuesOfProductRelation(plate);

        enginePowerCustomField =
            provider.getCustomFieldByCoreKeyId(enginePower);
        if (enginePowerCustomField.isVisible)
          enginePowerValue =
              product.selectedValuesOfProductRelation(enginePower);

        transmissionCustomField =
            provider.getCustomFieldByCoreKeyId(transmission);
        if (transmissionCustomField.isVisible)
          transmissionValue =
              product.selectedValuesOfProductRelation(transmission);

        mileageCustomField = provider.getCustomFieldByCoreKeyId(mileage);
        if (mileageCustomField.isVisible)
          mileageValue = product.selectedValuesOfProductRelation(mileage);

        licenseExpirationDateCustomField =
            provider.getCustomFieldByCoreKeyId(licenseExpirationDate);
        if (licenseExpirationDateCustomField.isVisible)
          licenseExpirationDateValue =
              product.selectedValuesOfProductRelation(licenseExpirationDate);

        yearCustomField = provider.getCustomFieldByCoreKeyId(year);
        if (yearCustomField.isVisible)
          yearValue = product.selectedValuesOfProductRelation(year);

        conditionCustomField = provider.getCustomFieldByCoreKeyId(condition);
        if (conditionCustomField.isVisible)
          conditionValue = product.selectedValuesOfProductRelation(condition);

        provider.subCategoryCoreField =
            provider.getCoreFieldByFieldName(PsConst.FIELD_NAME_SUBCATEGORY);

        return Container(
          margin: const EdgeInsets.symmetric(
              vertical: PsDimens.space10, horizontal: PsDimens.space16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('vehicle_specification'.tr,
                  style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                        color: Utils.isLightMode(context)
                            ? PsColors.text800
                            : PsColors.text50,
                      )),
              Container(
                margin: const EdgeInsets.only(top: PsDimens.space16),
                padding:
                    const EdgeInsets.symmetric(horizontal: PsDimens.space16),
                child: GridView(
                    padding: const EdgeInsets.all(0),
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent:
                          MediaQuery.sizeOf(context).width * 0.29,
                      childAspectRatio:
                          MediaQuery.sizeOf(context).width * 0.0038,
                    ),
                    children: <Widget>[
                      if (plateValue != '')
                        SpecificationWidgetItem(
                          icon: Icons.pin_outlined,
                          data: plateValue,
                        ),
                      if (enginePowerValue != '')
                        SpecificationWidgetItem(
                            icon: Icons.electric_bolt_outlined,
                            data: enginePowerValue),
                      if (transmissionValue != '')
                        SpecificationWidgetItem(
                            image: 'assets/images/manual.png',
                            data: transmissionValue),
                      if (mileageValue != '')
                        SpecificationWidgetItem(
                            icon: Icons.speed, data: mileageValue),
                      if (licenseExpirationDateValue != '')
                        SpecificationWidgetItem(
                            icon: Icons.warning_amber_outlined,
                            data: licenseExpirationDateValue),
                      if (yearValue != '')
                        SpecificationWidgetItem(
                            icon: Icons.access_time, data: yearValue),
                      SpecificationWidgetItem(
                          icon: Remix.car_line,
                          data: product.category?.catName ?? ''),
                      if (product.subCategory?.name != '' &&
                          product.subCategory?.name != null &&
                          provider.subCategoryCoreField.isVisible)
                        SpecificationWidgetItem(
                            icon: Remix.steering_line,
                            data: product.subCategory!.name!),
                      if (conditionValue != '')
                        SpecificationWidgetItem(
                            icon: Icons.sell_outlined, data: conditionValue),
                    ]),
              ),
            ],
          ),
        );
      }),
    );
  }
}

class SpecificationWidgetItem extends StatelessWidget {
  const SpecificationWidgetItem({this.icon, this.image, required this.data});

  final IconData? icon;
  final String data;
  final String? image;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          if (icon != null)
            Icon(
              icon,
              size: 20,
              color: Utils.isLightMode(context)
                  ? PsColors.text800
                  : PsColors.text50,
            )
          else
            Image.asset(
              image!,
              width: 20,
              height: 20,
              color: Utils.isLightMode(context)
                  ? PsColors.text800
                  : PsColors.text50,
            ),
          const SizedBox(
            height: PsDimens.space4,
          ),
          Flexible(
            child: Text(data,
                maxLines: 1,
                style: Theme.of(context).textTheme.bodySmall!.copyWith(
                      fontWeight: FontWeight.w400,
                      fontSize: 16,
                      overflow: TextOverflow.ellipsis,
                      color: Utils.isLightMode(context)
                          ? PsColors.text800
                          : PsColors.text50,
                    )),
          )
        ],
      ),
    );
  }
}
